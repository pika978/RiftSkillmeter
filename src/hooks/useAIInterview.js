
import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../api/api';

/**
 * Hook for AI Interview with Gemini Live + Tavus
 * DIRECT PORT from working GeminiLiveLab.jsx with minor adaptations for Hook usage.
 */
export const useAIInterview = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('Disconnected');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarStatus, setAvatarStatus] = useState('unavailable');
    const [error, setError] = useState(null);
    const [sessionId, setSessionId] = useState(null);

    const wsRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const streamRef = useRef(null);

    // Play audio response using Web Audio API (PCM requires this)
    const playAudio = useCallback(async (base64Audio, sampleRate = 24000) => {
        try {
            // Initialize AudioContext if not already done
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
                    sampleRate: sampleRate
                });
            }

            const audioContext = audioContextRef.current;

            // Resume context if suspended (autoplay policy)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Decode base64 to bytes
            const audioData = atob(base64Audio);
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
            }

            // Convert PCM bytes to Float32 samples
            // Gemini sends 16-bit PCM at 24kHz
            const int16Array = new Int16Array(arrayBuffer);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768.0; // Normalize to [-1, 1]
            }

            // Create audio buffer
            const audioBuffer = audioContext.createBuffer(1, float32Array.length, sampleRate);
            audioBuffer.getChannelData(0).set(float32Array);

            // Play the buffer
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start();

            console.log(`Playing AI response (${float32Array.length} samples)`);

        } catch (error) {
            console.error('Audio playback error:', error);
            setError(`Audio decode error: ${error.message}`);
        }
    }, []);

    // Connect WebSocket
    const connectWebSocket = useCallback((session_id) => {
        // Dynamic WebSocket URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = import.meta.env.DEV ? 'localhost:8001' : window.location.host;
        const wsUrl = `${protocol}//${host}/ws/interview/${session_id}/stream/`;

        console.log('Connecting to WebSocket:', wsUrl);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            setStatus('Connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'audio') {
                    console.log(`🔊 Received audio chunk (${data.audio.length} chars)`);
                    playAudio(data.audio, data.sample_rate || 24000);
                } else if (data.type === 'avatar') {
                    setAvatarUrl(data.url);
                    setAvatarStatus(data.status);
                    console.log('Avatar status:', data.status);
                } else if (data.type === 'transcript') {
                    console.log(`AI Transcript: ${data.text}`);
                } else if (data.type === 'error') {
                    console.error('Server error:', data.error);
                    setError(data.error);
                }
            } catch (e) {
                console.error('Message parse error:', e);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('Connection error');
            setStatus('Error');
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            setStatus('Disconnected');
        };

        wsRef.current = ws;
    }, [playAudio]);

    // Start Session (replaces internal connect logic of Lab)
    const startAISession = useCallback(async (formData) => {
        try {
            setStatus('Connecting...');
            setError(null);

            // Note: GeminLiveLab uses fetch/JSON. MentorConnect uses formData.
            // We keep api.post but ensure backend handles verify (it does).
            const response = await api.post('/interview/start/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            console.log('Session created:', response.data);
            setSessionId(response.data.session_id);
            setAvatarUrl(response.data.conversation_url);

            if (response.data.conversation_url) {
                setAvatarStatus('ready');
            }

            // Connect WebSocket
            connectWebSocket(response.data.session_id);

        } catch (err) {
            console.error('Failed to start session:', err);
            setError(err.response?.data?.error || err.message);
            setStatus('Error');
            throw err; // Re-throw for UI handling
        }
    }, [connectWebSocket]);

    // Start Recording
    const startRecording = useCallback(async () => {
        try {
            // Resume audio context on user interaction (Critical fix)
            if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            streamRef.current = stream;
            console.log('Microphone access granted');

            // Create MediaRecorder with SAME settings as GeminiLiveLab
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64Audio = reader.result.split(',')[1];
                        wsRef.current.send(JSON.stringify({
                            type: 'audio',
                            audio: base64Audio
                        }));
                        // console.log('Sent audio chunk');
                    };
                    reader.readAsDataURL(event.data);
                }
            };

            mediaRecorder.start(250); // Same interval as Lab
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            console.log('Recording started');

        } catch (err) {
            console.error('Microphone error:', err);
            setError('Microphone access denied');
        }
    }, []);

    // Stop Recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        // Send end of turn signal (Both variants)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('Sending end_turn signal');
            wsRef.current.send(JSON.stringify({ type: 'end_of_turn' }));
            wsRef.current.send(JSON.stringify({ type: 'end_turn' })); // redundancy
        }

        setIsRecording(false);
    }, []);

    // Disconnect
    const disconnectSession = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsConnected(false);
        setIsRecording(false);
        setStatus('Disconnected');
        setAvatarUrl(null);
        setAvatarStatus('unavailable');
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            disconnectSession();
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => console.error(e));
                audioContextRef.current = null;
            }
        };
    }, [disconnectSession]);

    return {
        isConnected,
        isRecording,
        status,
        avatarUrl,
        avatarStatus,
        error,
        startAISession,
        startRecording,
        stopRecording,
        disconnectSession,
        sessionId
    };
};
