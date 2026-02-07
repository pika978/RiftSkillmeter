import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Mic, MicOff, Volume2, Settings, Video, VideoOff } from 'lucide-react';

/**
 * Gemini Live API Testing Lab
 * 
 * This page tests the Gemini Live audio flow:
 * 1. Microphone input → Backend WebSocket
 * 2. Backend → Gemini Live API
 * 3. Gemini audio response → Backend → Frontend
 * 4. Play audio response
 * 5. Tavus avatar (if available)
 */

const GeminiLiveLab = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState('Disconnected');
    const [logs, setLogs] = useState([]);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarStatus, setAvatarStatus] = useState('unavailable');
    const [systemPrompt, setSystemPrompt] = useState(
        "You are a friendly AI assistant. Keep responses short and conversational."
    );

    const wsRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioContextRef = useRef(null);
    const streamRef = useRef(null);

    // Add log entry
    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { timestamp, message, type }]);
    };

    // Connect to WebSocket
    const connect = async () => {
        try {
            addLog('Connecting to WebSocket...', 'info');

            // Create a test session first
            const response = await fetch('http://localhost:8001/api/interview/start/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    skill_topic: 'Gemini Live Test',
                    level: 'intermediate'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            addLog(`Session created: ${data.session_id}`, 'success');

            // Connect WebSocket
            const wsUrl = `ws://localhost:8001/ws/interview/${data.session_id}/stream/`;
            addLog(`Connecting to: ${wsUrl}`, 'info');

            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                addLog('WebSocket connected!', 'success');
                setIsConnected(true);
                setStatus('Connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    addLog(`Received: ${data.type}`, 'info');

                    if (data.type === 'audio') {
                        // Play received audio (use sample_rate from server, default 24kHz)
                        playAudio(data.audio, data.sample_rate || 24000);
                    } else if (data.type === 'avatar') {
                        // Tavus avatar URL received
                        setAvatarUrl(data.url);
                        setAvatarStatus(data.status);
                        if (data.url) {
                            addLog(`Avatar ready: ${data.url}`, 'success');
                        } else {
                            addLog(`Avatar: ${data.message || 'Not available'}`, 'warning');
                        }
                    } else if (data.type === 'transcript') {
                        addLog(`AI: ${data.text}`, 'transcript');
                    } else if (data.type === 'error') {
                        addLog(`Error: ${data.error}`, 'error');
                    }
                } catch (e) {
                    addLog(`Parse error: ${e.message}`, 'error');
                }
            };

            ws.onerror = (error) => {
                addLog(`WebSocket error: ${error}`, 'error');
            };

            ws.onclose = () => {
                addLog('WebSocket disconnected', 'warning');
                setIsConnected(false);
                setStatus('Disconnected');
            };

            wsRef.current = ws;

        } catch (error) {
            addLog(`Connection failed: ${error.message}`, 'error');
            setStatus('Error');
        }
    };

    // Disconnect WebSocket
    const disconnect = () => {
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
        addLog('Disconnected', 'info');
    };

    // Start recording
    const startRecording = async () => {
        try {
            addLog('Requesting microphone access...', 'info');

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            streamRef.current = stream;
            addLog('Microphone access granted', 'success');

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
                    // Convert to base64 and send
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64Audio = reader.result.split(',')[1];
                        wsRef.current.send(JSON.stringify({
                            type: 'audio',
                            audio: base64Audio
                        }));
                        addLog('Sent audio chunk', 'info');
                    };
                    reader.readAsDataURL(event.data);
                }
            };

            // Send audio chunks every 250ms
            mediaRecorder.start(250);
            mediaRecorderRef.current = mediaRecorder;

            setIsRecording(true);
            addLog('Recording started', 'success');

        } catch (error) {
            addLog(`Microphone error: ${error.message}`, 'error');
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        // Send end of turn signal
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'end_of_turn'
            }));
            addLog('End of turn sent', 'info');
        }

        setIsRecording(false);
        addLog('Recording stopped', 'info');
    };

    // Play audio response using Web Audio API (PCM requires this)
    const playAudio = async (base64Audio, sampleRate = 24000) => {
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

            addLog(`Playing AI response (${float32Array.length} samples)`, 'success');

        } catch (error) {
            addLog(`Audio decode error: ${error.message}`, 'error');
            console.error('Audio playback error:', error);
        }
    };

    // Clear logs
    const clearLogs = () => {
        setLogs([]);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        🧪 Gemini Live API Test Lab
                    </h1>
                    <p className="text-gray-400">
                        Test the complete audio flow: Microphone → WebSocket → Gemini → Audio Response
                    </p>
                </div>

                {/* Status Bar */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                    }`}></div>
                                <span className="font-semibold">{status}</span>
                            </div>
                            {isRecording && (
                                <div className="flex items-center gap-2 text-red-400">
                                    <Mic className="w-4 h-4 animate-pulse" />
                                    <span>Recording...</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {!isConnected ? (
                                <button
                                    onClick={connect}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Play className="w-4 h-4" />
                                    Connect
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={disconnect}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <Square className="w-4 h-4" />
                                        Disconnect
                                    </button>

                                    {!isRecording ? (
                                        <button
                                            onClick={startRecording}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <Mic className="w-4 h-4" />
                                            Start Recording
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopRecording}
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center gap-2 transition-colors"
                                        >
                                            <MicOff className="w-4 h-4" />
                                            Stop Recording
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Avatar Panel - Shows Tavus video if available */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 mb-6 border border-purple-500/20">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        {avatarStatus === 'ready' ? (
                            <Video className="w-5 h-5 text-green-400" />
                        ) : (
                            <VideoOff className="w-5 h-5 text-gray-400" />
                        )}
                        AI Avatar
                        <span className={`text-xs px-2 py-1 rounded-full ${avatarStatus === 'ready'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                            {avatarStatus === 'ready' ? 'Active' : 'Audio Only'}
                        </span>
                    </h2>

                    <div className="aspect-video bg-gray-900/50 rounded-lg overflow-hidden flex items-center justify-center">
                        {avatarUrl ? (
                            <iframe
                                src={avatarUrl}
                                className="w-full h-full"
                                allow="camera; microphone; autoplay"
                                allowFullScreen
                            />
                        ) : (
                            <div className="text-center text-gray-500">
                                <VideoOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">Avatar Not Available</p>
                                <p className="text-sm mt-2">
                                    {isConnected
                                        ? 'Audio responses will play through speakers'
                                        : 'Connect to check avatar availability'
                                    }
                                </p>
                                {isConnected && (
                                    <p className="text-xs mt-4 text-gray-600">
                                        Tavus requires a paid subscription for video avatars
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Configuration Panel */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Configuration
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">System Prompt</label>
                                <textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-sm h-32 resize-none"
                                    placeholder="Enter system prompt..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-700/30 rounded p-3">
                                    <div className="text-gray-400">Model</div>
                                    <div className="font-mono text-xs mt-1">gemini-2.5-flash-preview</div>
                                </div>
                                <div className="bg-gray-700/30 rounded p-3">
                                    <div className="text-gray-400">Voice</div>
                                    <div className="font-mono text-xs mt-1">Puck</div>
                                </div>
                                <div className="bg-gray-700/30 rounded p-3">
                                    <div className="text-gray-400">Sample Rate</div>
                                    <div className="font-mono text-xs mt-1">16kHz</div>
                                </div>
                                <div className="bg-gray-700/30 rounded p-3">
                                    <div className="text-gray-400">Channels</div>
                                    <div className="font-mono text-xs mt-1">Mono</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logs Panel */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Volume2 className="w-5 h-5" />
                                Event Logs
                            </h2>
                            <button
                                onClick={clearLogs}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="bg-gray-900/50 rounded-lg p-4 h-80 overflow-y-auto font-mono text-xs space-y-1">
                            {logs.length === 0 ? (
                                <div className="text-gray-500 text-center py-8">
                                    No logs yet. Click "Connect" to start.
                                </div>
                            ) : (
                                logs.map((log, index) => (
                                    <div key={index} className={`
                                        ${log.type === 'error' ? 'text-red-400' : ''}
                                        ${log.type === 'success' ? 'text-green-400' : ''}
                                        ${log.type === 'warning' ? 'text-yellow-400' : ''}
                                        ${log.type === 'transcript' ? 'text-purple-400' : ''}
                                        ${log.type === 'info' ? 'text-gray-300' : ''}
                                    `}>
                                        <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="font-semibold mb-3 text-blue-300">📋 Testing Instructions</h3>
                    <ol className="space-y-2 text-sm text-gray-300">
                        <li><strong>1. Connect:</strong> Click "Connect" to establish WebSocket connection</li>
                        <li><strong>2. Record:</strong> Click "Start Recording" and speak into your microphone</li>
                        <li><strong>3. Stop:</strong> Click "Stop Recording" to signal end of your turn</li>
                        <li><strong>4. Listen:</strong> Gemini will process and respond with audio</li>
                        <li><strong>5. Monitor:</strong> Watch the event logs for real-time feedback</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default GeminiLiveLab;
