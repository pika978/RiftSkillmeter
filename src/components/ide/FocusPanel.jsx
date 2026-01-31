import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, Brain, AlertTriangle, Clock, Target, Play, Pause, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

const API_URL = 'http://localhost:8001/api';

export function FocusPanel() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const cameraRef = useRef(null);
    const faceMeshRef = useRef(null);
    const audioContextRef = useRef(null);
    const isDistractedRef = useRef(false);
    const isSessionActiveRef = useRef(false);
    const wasDistractedThisSecondRef = useRef(false); // Track if distracted at all during current second
    const constraintsRef = useRef(null);

    const dragControls = useDragControls();

    const [isExpanded, setIsExpanded] = useState(true);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isDistracted, setIsDistracted] = useState(false);
    const [distractionCount, setDistractionCount] = useState(0);
    const [focusTime, setFocusTime] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [headDirection, setHeadDirection] = useState('Forward');
    const [lastAlertTime, setLastAlertTime] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(null);

    const { toast } = useToast();
    const { authFetch } = useAuth();

    // Save session to backend
    const saveSession = useCallback(async () => {
        if (!sessionStartTime || totalTime === 0) return;

        try {
            const focusPercentage = totalTime > 0 ? (focusTime / totalTime) * 100 : 100;

            const response = await authFetch(`${API_URL}/study-sessions/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startedAt: sessionStartTime.toISOString(),
                    totalDuration: totalTime,
                    focusDuration: focusTime,
                    distractionCount: distractionCount,
                    focusPercentage: focusPercentage
                })
            });

            if (response.ok) {
                toast({
                    title: '💾 Session Saved!',
                    description: `${Math.floor(focusTime / 60)}m of focus time recorded.`
                });
            }
        } catch (error) {
            console.error('Save session error:', error);
        }
    }, [sessionStartTime, totalTime, focusTime, distractionCount, authFetch, toast]);

    // Play beep sound for distraction alert
    const playAlertSound = useCallback(() => {
        const now = Date.now();
        if (now - lastAlertTime < 2000) return;
        setLastAlertTime(now);

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioContextRef.current;

            for (let i = 0; i < 4; i++) {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'sine';

                const startTime = ctx.currentTime + (i * 0.15);
                gainNode.gain.setValueAtTime(0.3, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.1);
            }
        } catch (e) {
            console.warn('Audio alert failed:', e);
        }
    }, [lastAlertTime]);

    // Calculate head pose
    const calculateHeadPose = useCallback((landmarks) => {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const eyeCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2
        };
        const noseOffset = nose.x - eyeCenter.x;
        const noseVerticalOffset = nose.y - eyeCenter.y;

        const horizontalThreshold = 0.045;
        const verticalThreshold = 0.07;
        const upThreshold = -0.05;

        let direction = 'Forward';
        let distracted = false;

        if (noseOffset < -horizontalThreshold) {
            direction = 'Turning Right';
            distracted = true;
        } else if (noseOffset > horizontalThreshold) {
            direction = 'Turning Left';
            distracted = true;
        } else if (noseVerticalOffset > verticalThreshold) {
            direction = 'Looking Down';
            distracted = false;
        } else if (noseVerticalOffset < upThreshold) {
            direction = 'Looking Up';
            distracted = true;
        }

        return { direction, distracted };
    }, []);

    // Process face mesh results
    const onResults = useCallback((results) => {
        if (!canvasRef.current || !videoRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const video = videoRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            const { direction, distracted } = calculateHeadPose(landmarks);
            setHeadDirection(direction);

            if (distracted && isSessionActiveRef.current) {
                // Mark that we were distracted during this second (for accurate focus time)
                wasDistractedThisSecondRef.current = true;

                if (!isDistractedRef.current) {
                    setDistractionCount(prev => prev + 1);
                    playAlertSound();
                }
                setIsDistracted(true);
                isDistractedRef.current = true;
            } else {
                setIsDistracted(false);
                isDistractedRef.current = false;
            }

            // Draw simplified face outline
            const mainColor = distracted ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)';
            const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < faceOval.length; i++) {
                const x = landmarks[faceOval[i]].x * canvas.width;
                const y = landmarks[faceOval[i]].y * canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            ctx.fillStyle = distracted ? '#ef4444' : '#22c55e';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText(direction, 8, 18);
        }
    }, [calculateHeadPose, playAlertSound]);

    // Initialize face mesh
    const initFaceMesh = useCallback(async () => {
        const faceMesh = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`
        });

        await faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults(onResults);
        faceMeshRef.current = faceMesh;
        return faceMesh;
    }, [onResults]);

    // Start camera
    const startCamera = useCallback(async () => {
        if (!videoRef.current) return;

        try {
            await initFaceMesh();

            const camera = new MediaPipeCamera(videoRef.current, {
                onFrame: async () => {
                    if (faceMeshRef.current && videoRef.current) {
                        await faceMeshRef.current.send({ image: videoRef.current });
                    }
                },
                width: 320,
                height: 240
            });

            await camera.start();
            cameraRef.current = camera;
            setIsCameraOn(true);
        } catch (error) {
            console.error('Camera error:', error);
            toast({
                title: 'Camera Error',
                description: 'Could not access camera.',
                variant: 'destructive'
            });
        }
    }, [initFaceMesh, toast]);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
        if (faceMeshRef.current) {
            faceMeshRef.current.close();
            faceMeshRef.current = null;
        }
        setIsCameraOn(false);
        setIsDistracted(false);
        setHeadDirection('Forward');
    }, []);

    // Toggle session
    const toggleSession = useCallback(() => {
        if (isSessionActive) {
            setIsSessionActive(false);
            isSessionActiveRef.current = false;
            saveSession();
        } else {
            if (!isCameraOn) {
                startCamera();
            }
            if (!sessionStartTime) {
                setSessionStartTime(new Date());
            }
            setIsSessionActive(true);
            isSessionActiveRef.current = true;
        }
    }, [isSessionActive, isCameraOn, startCamera, saveSession, sessionStartTime]);

    // Timer effect
    useEffect(() => {
        let interval;
        if (isSessionActive) {
            interval = setInterval(() => {
                setTotalTime(prev => prev + 1);
                // Only increment focus time if we weren't distracted at all during this second
                if (!wasDistractedThisSecondRef.current) {
                    setFocusTime(prev => prev + 1);
                }
                // Reset the flag for the next second
                wasDistractedThisSecondRef.current = false;
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isSessionActive]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [stopCamera]);

    const focusPercentage = totalTime > 0 ? Math.round((focusTime / totalTime) * 100) : 100;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {/* Drag constraints - full viewport */}
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" />

            <motion.div
                drag
                dragControls={dragControls}
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={constraintsRef}
                initial={{ opacity: 0, y: 20, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                style={{ position: 'fixed', bottom: 16, left: '50%', zIndex: 50 }}
                className="cursor-default"
            >
                <div className={`bg-card border-2 border-black rounded-none shadow-[4px_4px_0px_0px_#000] transition-all ${isExpanded ? 'w-[600px]' : 'w-auto'}`}>
                    {/* Header Bar - Always Visible */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-black/20">
                        {/* Drag Handle */}
                        <div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="cursor-grab active:cursor-grabbing p-1 -ml-2 mr-1 hover:bg-muted rounded"
                        >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            <span className="font-bold text-sm">Focus Mode</span>
                            {isSessionActive && (
                                <Badge variant={isDistracted ? "destructive" : "default"} className="text-xs">
                                    {isDistracted ? 'Distracted' : 'Focused'}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={toggleSession}
                                className={`h-7 rounded-none border border-black text-xs ${isSessionActive
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-green-500 hover:bg-green-600'
                                    }`}
                            >
                                {isSessionActive ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                                {isSessionActive ? 'Stop' : 'Start'}
                            </Button>
                            {/* Camera toggle button - visible when camera is on and session is not active */}
                            {isCameraOn && !isSessionActive && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={stopCamera}
                                    className="h-7 rounded-none border border-black text-xs"
                                >
                                    <CameraOff className="h-3 w-3 mr-1" />
                                    Off
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="h-7 w-7 p-0"
                            >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex p-3 gap-4">
                                    {/* Camera Preview */}
                                    <div className="relative w-40 h-30 bg-slate-900 rounded overflow-hidden flex-shrink-0">
                                        <video
                                            ref={videoRef}
                                            className="absolute inset-0 w-full h-full object-cover"
                                            autoPlay
                                            muted
                                            playsInline
                                        />
                                        <canvas
                                            ref={canvasRef}
                                            className="absolute inset-0 w-full h-full"
                                        />
                                        {!isCameraOn && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <CameraOff className="h-6 w-6 text-slate-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex-1 grid grid-cols-3 gap-3">
                                        {/* Timer */}
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                                                <Clock className="h-3 w-3" />
                                                Time
                                            </div>
                                            <div className="text-xl font-bold font-mono">{formatTime(totalTime)}</div>
                                            <div className="text-xs text-muted-foreground">Focus: {formatTime(focusTime)}</div>
                                        </div>

                                        {/* Focus Score */}
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                                                <Target className="h-3 w-3" />
                                                Score
                                            </div>
                                            <div className={`text-xl font-bold ${focusPercentage >= 80 ? 'text-green-500' : focusPercentage >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                {focusPercentage}%
                                            </div>
                                        </div>

                                        {/* Distractions */}
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                Distractions
                                            </div>
                                            <div className={`text-xl font-bold ${distractionCount === 0 ? 'text-green-500' : 'text-orange-500'}`}>
                                                {distractionCount}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
}
