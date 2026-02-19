import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing WebSocket connection to the Interview backend.
 * Handles session initialization, question flow, and performance report.
 */
export function useInterviewWebSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState("Waiting to start...");
    const [interviewReport, setInterviewReport] = useState(null);
    const [livekitToken, setLivekitToken] = useState(null);
    const [livekitUrl, setLivekitUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const wsRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 3;

    // Get WebSocket URL based on environment
    const getWsUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
        const host = import.meta.env.DEV ? 'localhost:8001' : new URL(apiUrl).host;
        return `${protocol}//${host}/ws/interview/`;
    };

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log("WebSocket already connected");
            return;
        }

        try {
            const wsUrl = getWsUrl();
            console.log("Connecting to WebSocket:", wsUrl);
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log("Interview WebSocket connected");
                setIsConnected(true);
                setError(null);
                reconnectAttempts.current = 0;
            };

            wsRef.current.onclose = (event) => {
                console.log("Interview WebSocket closed:", event.code);
                setIsConnected(false);

                // Attempt reconnect if not intentional close
                if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++;
                    setTimeout(connect, 2000 * reconnectAttempts.current);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error("WebSocket error:", error);
                setError("Connection error. Please check if the server is running.");
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleMessage(data);
                } catch (e) {
                    console.error("Failed to parse WebSocket message:", e);
                }
            };
        } catch (e) {
            console.error("Failed to connect WebSocket:", e);
            setError("Failed to connect to interview server.");
        }
    }, []);

    // Handle incoming messages
    const handleMessage = useCallback((data) => {
        console.log("WS Message received:", data.type);

        switch (data.type) {
            case 'SESSION_READY':
                setSessionId(data.session_id);
                setCurrentQuestion(data.opening_question);
                setLivekitToken(data.livekit_token);
                setLivekitUrl(data.livekit_url);
                setIsLoading(false);
                break;

            case 'NEXT_QUESTION':
                setCurrentQuestion(data.question);
                setIsLoading(false);
                break;

            case 'INTERVIEW_REPORT':
                setInterviewReport({
                    score: data.score,
                    feedback: data.feedback,
                    strengths: data.strengths,
                    weaknesses: data.weaknesses,
                    tips: data.tips,
                    transcript: data.transcript
                });
                setIsLoading(false);
                break;

            case 'ERROR':
                setError(data.message);
                setIsLoading(false);
                break;

            default:
                console.warn("Unknown message type:", data.type);
        }
    }, []);

    // Send message helper
    const sendMessage = useCallback((type, payload = {}) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
            setError("Not connected to server. Please refresh.");
            return false;
        }

        wsRef.current.send(JSON.stringify({ type, ...payload }));
        return true;
    }, []);

    // Initialize interview session
    const initSession = useCallback((topic, level, duration, userId, resumeUrl = null) => {
        setIsLoading(true);
        setInterviewReport(null);
        setCurrentQuestion("Connecting to AI interviewer...");

        return sendMessage('INIT_SESSION', {
            topic,
            level,
            duration,
            user_id: userId,
            resume_url: resumeUrl
        });
    }, [sendMessage]);

    // Submit user answer
    const submitAnswer = useCallback((answer) => {
        setIsLoading(true);
        return sendMessage('USER_ANSWER', { answer });
    }, [sendMessage]);

    // End session and get report
    const endSession = useCallback(() => {
        setIsLoading(true);
        setCurrentQuestion("Analyzing your performance...");
        return sendMessage('END_SESSION', {});
    }, [sendMessage]);

    // Disconnect WebSocket
    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close(1000, "User ended session");
            wsRef.current = null;
        }
        setIsConnected(false);
        setSessionId(null);
    }, []);

    // Reset state for new interview
    const reset = useCallback(() => {
        setCurrentQuestion("Waiting to start...");
        setInterviewReport(null);
        setSessionId(null);
        setLivekitToken(null);
        setLivekitUrl(null);
        setError(null);
        setIsLoading(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close(1000, "Component unmounted");
            }
        };
    }, []);

    return {
        // State
        isConnected,
        sessionId,
        currentQuestion,
        interviewReport,
        livekitToken,
        livekitUrl,
        isLoading,
        error,

        // Actions
        connect,
        disconnect,
        initSession,
        submitAnswer,
        endSession,
        reset
    };
}
