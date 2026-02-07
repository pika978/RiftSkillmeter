import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mic, MicOff, Video, Smartphone, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAIInterview } from '@/hooks/useAIInterview';
import { AnimatePresence, motion } from 'framer-motion';

const InterviewRoom = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { topic, level, resume } = location.state || {};

    // AI Hook
    const {
        sessionId: aiSessionId,
        isConnected: aiIsConnected,
        isRecording: aiIsRecording,
        status: aiStatus,
        error: aiError,
        avatarUrl,
        avatarStatus,
        startAISession,
        disconnectSession: endAISession,
        startRecording: startAIRecording,
        stopRecording: stopAIRecording,
    } = useAIInterview();

    const aiLoading = aiStatus === 'Connecting...';

    const videoRef = useRef(null);
    const [hasStarted, setHasStarted] = useState(false);

    // Redirect if no config
    useEffect(() => {
        if (!topic) {
            toast.error("No interview configuration found. Please start from Mentor Connect.");
            navigate('/mentor-connect');
        }
    }, [topic, navigate]);

    // Webcam Handling
    useEffect(() => {
        let stream = null;
        if (hasStarted && videoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(s => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => toast.error("Camera access denied or missing."));
        }
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [hasStarted]);

    // Cleanup session on unmount
    useEffect(() => {
        return () => {
            if (aiIsConnected) {
                endAISession();
            }
        };
    }, [aiIsConnected, endAISession]);

    const handleStartSession = async () => {
        setHasStarted(true);
        try {
            const formData = new FormData();
            formData.append('skill_topic', topic);

            const levelMap = { 'junior': 'beginner', 'mid': 'intermediate', 'senior': 'advanced' };
            formData.append('level', levelMap[level] || 'intermediate');

            if (resume) {
                formData.append('cv_file', resume);
            }

            await startAISession(formData);
            toast.success("Connecting to AI Interviewer...");
        } catch (error) {
            console.error(error);
            toast.error("Failed to start session.");
            setHasStarted(false);
        }
    };

    const handleEndSession = async () => {
        await endAISession();
        navigate('/mentor-connect');
        toast.info("Session ended.");
    };

    if (!topic) return null;

    return (
        <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/80 backdrop-blur-sm z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => navigate('/mentor-connect')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Exit
                    </Button>
                    <div>
                        <h1 className="text-sm font-bold flex items-center gap-2">
                            AI Interview: <span className="text-[#adfa1d]">{topic}</span>
                        </h1>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{level} Level</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={aiIsConnected ? "default" : "secondary"} className={aiIsConnected ? "bg-green-500" : "bg-gray-700"}>
                        {aiIsConnected ? "Connected" : aiStatus || "Offline"}
                    </Badge>
                    {hasStarted && (
                        <Button variant="destructive" size="sm" onClick={handleEndSession} className="font-bold uppercase tracking-wider">
                            End Interview
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content - Full Screen */}
            <div className="flex-1 relative bg-black">
                {!hasStarted ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-6 max-w-md p-8 border border-gray-800 rounded-lg bg-gray-900">
                            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#adfa1d] shadow-[0_0_20px_rgba(173,250,29,0.3)]">
                                <Smartphone className="h-10 w-10 text-[#adfa1d]" />
                            </div>
                            <h2 className="text-2xl font-bold">Ready to Start?</h2>
                            <ul className="text-left space-y-3 text-gray-400 text-sm mb-6">
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Topic: {topic}</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Level: {level}</li>
                                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Camera & Mic Access Required</li>
                            </ul>
                            <Button onClick={handleStartSession} className="w-full h-12 text-lg font-bold bg-[#adfa1d] text-black hover:bg-[#8ce000]">
                                Start Interview
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Avatar iFrame - Fills Entire Screen */}
                        {avatarUrl ? (
                            <iframe
                                src={`${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}activeSpeaker=true&showFullscreenButton=true&showLeaveButton=false&showLocalVideo=false&showParticipantsBar=false`}
                                allow="camera; microphone; fullscreen; autoplay"
                                className="absolute inset-0 w-full h-full border-0"
                                title="AI Interviewer"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-500 flex-col gap-4">
                                <div className="w-24 h-24 rounded-full border-4 border-gray-800 flex items-center justify-center animate-pulse">
                                    <Smartphone className="h-10 w-10" />
                                </div>
                                <p className="font-mono text-sm uppercase tracking-widest">{aiLoading ? "Connecting..." : "Waiting for Avatar..."}</p>
                            </div>
                        )}

                        {/* User PIP Camera - Top Right */}
                        <div className="absolute top-4 right-4 w-48 h-36 bg-black border-2 border-gray-700 shadow-2xl rounded-lg overflow-hidden z-20">
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white drop-shadow-md">You</span>
                            </div>
                        </div>

                        {/* Mic Controls - Bottom Center */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md p-3 rounded-full border border-gray-700 z-20">
                            {aiIsRecording ? (
                                <Button onClick={stopAIRecording} size="lg" className="rounded-full bg-red-500 hover:bg-red-600 w-16 h-16 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse">
                                    <MicOff className="h-6 w-6" />
                                </Button>
                            ) : (
                                <Button onClick={startAIRecording} disabled={!aiIsConnected} size="lg" className="rounded-full bg-[#adfa1d] hover:bg-[#8ce000] text-black w-16 h-16 shadow-[0_0_15px_rgba(173,250,29,0.5)]">
                                    <Mic className="h-6 w-6" />
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default InterviewRoom;
