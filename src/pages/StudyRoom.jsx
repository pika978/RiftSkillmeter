import { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, CameraOff, Brain, AlertTriangle, Clock, Target, Play, Pause, RotateCcw, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001/api');

export default function StudyRoom() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const cameraRef = useRef(null);
    const faceMeshRef = useRef(null);
    const audioContextRef = useRef(null);
    const isDistractedRef = useRef(false);
    const isSessionActiveRef = useRef(false);

    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isDistracted, setIsDistracted] = useState(false);
    const [distractionCount, setDistractionCount] = useState(0);
    const [focusTime, setFocusTime] = useState(0);
    const [totalTime, setTotalTime] = useState(0);
    const [headDirection, setHeadDirection] = useState('Forward');
    const [lastAlertTime, setLastAlertTime] = useState(0);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const { toast } = useToast();
    const { authFetch } = useAuth();

    // Save session to backend
    const saveSession = useCallback(async () => {
        if (!sessionStartTime || totalTime === 0) return;

        setIsSaving(true);
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
            } else {
                throw new Error('Failed to save session');
            }
        } catch (error) {
            console.error('Save session error:', error);
            toast({
                title: 'Save Failed',
                description: 'Could not save session to database.',
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    }, [sessionStartTime, totalTime, focusTime, distractionCount, authFetch, toast]);


    // Play beep sound for distraction alert (4 rapid beeps)
    const playAlertSound = useCallback(() => {
        const now = Date.now();
        if (now - lastAlertTime < 2000) return; // Prevent spam (2 second cooldown)
        setLastAlertTime(now);

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioContextRef.current;

            // Play 4 beeps
            for (let i = 0; i < 4; i++) {
                const oscillator = ctx.createOscillator();
                const gainNode = ctx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(ctx.destination);

                oscillator.frequency.value = 800; // Frequency in Hz
                oscillator.type = 'sine';

                // Beep duration and timing
                const startTime = ctx.currentTime + (i * 0.15); // 0.15s interval
                gainNode.gain.setValueAtTime(0.3, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.1);
            }
        } catch (e) {
            console.warn('Audio alert failed:', e);
        }
    }, [lastAlertTime]);

    // Calculate head pose and gaze from face landmarks
    const calculateHeadPose = useCallback((landmarks) => {
        // Key landmark indices
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const leftIris = landmarks[468]; // Center of left iris
        const rightIris = landmarks[473]; // Center of right iris

        // 1. Head Pose Calculation
        const eyeCenter = {
            x: (leftEye.x + rightEye.x) / 2,
            y: (leftEye.y + rightEye.y) / 2
        };
        const noseOffset = nose.x - eyeCenter.x;
        const noseVerticalOffset = nose.y - eyeCenter.y;

        // 2. Gaze Calculation (if iris landmarks available)
        let gazeDirection = 'Center';
        if (leftIris && rightIris) {
            // Calculate iris position relative to eye corners for horizontal gaze
            // Left eye corners: 33 (inner), 133 (outer) - this varies by model, approximating with eye center
            // Simplified gaze: check iris offset from eye center
            const leftEyeWidth = Math.abs(landmarks[133].x - landmarks[33].x);
            const leftIrisOffset = leftIris.x - ((landmarks[133].x + landmarks[33].x) / 2);

            // Normalized offset (0 usually, negative = right(user left), positive = left(user right))
            // Note: Camera is mirrored usually, so left on screen is user's right
            const gazeThreshold = 0.05 * leftEyeWidth;

            // This is a simplified heuristic
        }

        // Thresholds (refined for better sensitivity)
        // Horizontal: > 0.03 means turning head significantly
        // Vertical: > 0.06 means looking down, < -0.04 means looking up
        const horizontalThreshold = 0.045; // Increased slightly to reduce false positives
        const verticalThreshold = 0.07;
        const upThreshold = -0.05;

        let direction = 'Forward';
        let distracted = false;

        // Check Head Pose first (gross movement)
        if (noseOffset < -horizontalThreshold) {
            direction = 'Turning Right';
            distracted = true;
        } else if (noseOffset > horizontalThreshold) {
            direction = 'Turning Left';
            distracted = true;
        } else if (noseVerticalOffset > verticalThreshold) {
            direction = 'Looking Down';
            distracted = false; // ALLOWED: Looking down (notes/book) is NOT a distraction
        } else if (noseVerticalOffset < upThreshold) {
            direction = 'Looking Up';
            distracted = true;
        }

        // Refine with subtle gaze if head is forward
        // (This would require more complex geometry, sticking to robust head pose for now to avoid annoyance)

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

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];

            // Calculate head pose
            const { direction, distracted } = calculateHeadPose(landmarks);
            setHeadDirection(direction);

            // Handle distraction
            if (distracted && isSessionActiveRef.current) {
                // If we werent distracted before, this is a new distraction event
                if (!isDistractedRef.current) {
                    setDistractionCount(prev => prev + 1);
                    playAlertSound();
                    toast({
                        title: '⚠️ Stay Focused!',
                        description: `You're ${direction.toLowerCase()}. Keep your eyes on the screen!`,
                        variant: 'destructive'
                    });
                }
                setIsDistracted(true);
                isDistractedRef.current = true;
            } else {
                setIsDistracted(false);
                isDistractedRef.current = false;
            }

            // Draw face mesh landmarks and key features
            const mainColor = distracted ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)';
            const secondaryColor = distracted ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)';

            // Helper function to draw a point
            const drawPoint = (idx, color, size = 2) => {
                const x = landmarks[idx].x * canvas.width;
                const y = landmarks[idx].y * canvas.height;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, 2 * Math.PI);
                ctx.fill();
            };

            // Helper function to draw a line between landmarks
            const drawLine = (idx1, idx2, color) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(landmarks[idx1].x * canvas.width, landmarks[idx1].y * canvas.height);
                ctx.lineTo(landmarks[idx2].x * canvas.width, landmarks[idx2].y * canvas.height);
                ctx.stroke();
            };

            // Draw face oval contour
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

            // Draw left eye contour
            const leftEye = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33];
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < leftEye.length; i++) {
                const x = landmarks[leftEye[i]].x * canvas.width;
                const y = landmarks[leftEye[i]].y * canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw right eye contour
            const rightEye = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263];
            ctx.beginPath();
            for (let i = 0; i < rightEye.length; i++) {
                const x = landmarks[rightEye[i]].x * canvas.width;
                const y = landmarks[rightEye[i]].y * canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw iris landmarks (if available with refineLandmarks: true)
            // Left iris: 468-472, Right iris: 473-477
            const leftIris = [468, 469, 470, 471, 472];
            const rightIris = [473, 474, 475, 476, 477];

            ctx.fillStyle = mainColor;
            leftIris.forEach(idx => {
                if (landmarks[idx]) drawPoint(idx, mainColor, 3);
            });
            rightIris.forEach(idx => {
                if (landmarks[idx]) drawPoint(idx, mainColor, 3);
            });

            // Draw nose bridge
            drawLine(168, 6, secondaryColor);
            drawLine(6, 197, secondaryColor);
            drawLine(197, 195, secondaryColor);

            // Draw key points (nose tip, chin, forehead)
            drawPoint(1, mainColor, 4);   // Nose tip
            drawPoint(152, mainColor, 3); // Chin
            drawPoint(10, mainColor, 3);  // Forehead

            // Draw mouth outline
            const mouth = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61];
            ctx.strokeStyle = secondaryColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < mouth.length; i++) {
                const x = landmarks[mouth[i]].x * canvas.width;
                const y = landmarks[mouth[i]].y * canvas.height;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw direction indicator text
            ctx.fillStyle = distracted ? '#ef4444' : '#22c55e';
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.fillText(direction, 20, 30);
        }
    }, [calculateHeadPose, isDistracted, isSessionActive, playAlertSound, toast]);

    // Initialize face mesh
    const initFaceMesh = useCallback(async () => {
        try {
            console.log('Initializing FaceMesh...');
            const faceMesh = new FaceMesh({
                locateFile: (file) => {
                    // Use specific version for stability
                    const url = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
                    console.log('Loading:', url);
                    return url;
                }
            });

            await faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            faceMesh.onResults(onResults);
            faceMeshRef.current = faceMesh;

            console.log('FaceMesh initialized successfully!');
            return faceMesh;
        } catch (error) {
            console.error('FaceMesh initialization failed:', error);
            toast({
                title: 'Face Detection Error',
                description: 'Could not load face detection model. Please refresh the page.',
                variant: 'destructive'
            });
            throw error;
        }
    }, [onResults, toast]);

    // Start camera
    const startCamera = useCallback(async () => {
        if (!videoRef.current) return;

        try {
            const faceMesh = await initFaceMesh();

            const camera = new MediaPipeCamera(videoRef.current, {
                onFrame: async () => {
                    if (faceMeshRef.current && videoRef.current) {
                        await faceMeshRef.current.send({ image: videoRef.current });
                    }
                },
                width: 640,
                height: 480
            });

            await camera.start();
            cameraRef.current = camera;
            setIsCameraOn(true);

            toast({
                title: '📹 Camera Active',
                description: 'Face detection is now running'
            });
        } catch (error) {
            console.error('Camera error:', error);
            toast({
                title: 'Camera Error',
                description: 'Could not access camera. Please check permissions.',
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

    // Toggle study session
    const toggleSession = useCallback(() => {
        if (isSessionActive) {
            setIsSessionActive(false);
            isSessionActiveRef.current = false;
            toast({
                title: '⏸️ Session Paused',
                description: `Focus time: ${Math.floor(focusTime / 60)}m ${focusTime % 60}s`
            });
        } else {
            if (!isCameraOn) {
                startCamera();
            }
            if (!sessionStartTime) {
                setSessionStartTime(new Date());
            }
            setIsSessionActive(true);
            isSessionActiveRef.current = true;
            toast({
                title: '🎯 Session Started',
                description: 'Stay focused! I\'ll alert you if you look away.'
            });
        }
    }, [isSessionActive, isCameraOn, startCamera, focusTime, toast, sessionStartTime]);

    // Reset session
    const resetSession = useCallback(() => {
        setIsSessionActive(false);
        isSessionActiveRef.current = false;
        setDistractionCount(0);
        setFocusTime(0);
        setTotalTime(0);
        setIsDistracted(false);
        isDistractedRef.current = false;
        setSessionStartTime(null);
    }, []);

    // Timer effect
    useEffect(() => {
        let interval;
        if (isSessionActive) {
            interval = setInterval(() => {
                setTotalTime(prev => prev + 1);
                // Use ref for immediate state check inside interval
                if (!isDistractedRef.current) {
                    setFocusTime(prev => prev + 1);
                }
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

    // Calculate focus percentage
    const focusPercentage = totalTime > 0 ? Math.round((focusTime / totalTime) * 100) : 100;

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
                            <Brain className="h-8 w-8" />
                            Study Room
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            AI-powered focus monitoring to help you stay on track
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={resetSession}
                            className="rounded-none border-2 border-black"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                        <Button
                            variant="outline"
                            onClick={saveSession}
                            disabled={isSaving || totalTime === 0}
                            className="rounded-none border-2 border-black"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? 'Saving...' : 'Save Session'}
                        </Button>
                        <Button
                            onClick={toggleSession}
                            className={`rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000] ${isSessionActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                                }`}
                        >
                            {isSessionActive ? (
                                <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause Session
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Session
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Camera Feed */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="lg:col-span-2"
                    >
                        <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000] overflow-hidden">
                            <CardHeader className="border-b-2 border-black">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Camera className="h-5 w-5" />
                                        Focus Monitor
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <AnimatePresence>
                                            {isDistracted && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                >
                                                    <Badge variant="destructive" className="animate-pulse">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Distracted
                                                    </Badge>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <Badge variant={isCameraOn ? 'default' : 'secondary'}>
                                            {isCameraOn ? 'Camera On' : 'Camera Off'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 relative bg-black aspect-video">
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    playsInline
                                    muted
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="absolute inset-0 w-full h-full"
                                />
                                {!isCameraOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
                                        <CameraOff className="h-16 w-16 mb-4 text-gray-500" />
                                        <p className="text-gray-400 mb-4">Camera is off</p>
                                        <Button onClick={startCamera} variant="outline">
                                            Enable Camera
                                        </Button>
                                    </div>
                                )}

                                {/* Direction indicator overlay */}
                                {isCameraOn && (
                                    <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-2 rounded">
                                        <p className={`text-sm font-medium ${isDistracted ? 'text-red-400' : 'text-green-400'}`}>
                                            {headDirection}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Stats Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        {/* Session Timer */}
                        <Card className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Session Time
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-mono font-bold text-center">
                                    {formatTime(totalTime)}
                                </div>
                                <p className="text-center text-sm text-muted-foreground mt-1">
                                    Focus: {formatTime(focusTime)}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Focus Percentage */}
                        <Card className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Focus Score
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-4xl font-bold text-center ${focusPercentage >= 80 ? 'text-green-500' :
                                    focusPercentage >= 60 ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                    {focusPercentage}%
                                </div>
                                <Progress
                                    value={focusPercentage}
                                    className="mt-3 h-2"
                                />
                            </CardContent>
                        </Card>

                        {/* Distraction Count */}
                        <Card className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Distractions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-center text-orange-500">
                                    {distractionCount}
                                </div>
                                <p className="text-center text-sm text-muted-foreground mt-1">
                                    times you looked away
                                </p>
                            </CardContent>
                        </Card>

                        {/* Tips */}
                        <Card className="rounded-none border-2 border-black bg-gradient-to-br from-purple-50 to-blue-50">
                            <CardContent className="p-4">
                                <h4 className="font-medium mb-2">💡 Focus Tips</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Keep your screen at eye level</li>
                                    <li>• Take breaks every 25 minutes</li>
                                    <li>• Minimize background distractions</li>
                                    <li>• Stay hydrated!</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </DashboardLayout>
    );
}
