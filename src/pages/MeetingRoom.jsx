import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CodeEditor } from '../components/ide/CodeEditor'; // Reusing your existing component
import { CODE_SNIPPETS } from '@/api/piston';
import { Video, Mic, MicOff, VideoOff, PhoneOff, MessageSquare, Code, Layout, Share2, MoreVertical, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function MeetingRoom() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [activeTab, setActiveTab] = useState('code'); // 'code', 'whiteboard'

    // Code Editor state
    const [language, setLanguage] = useState('javascript');
    const [files, setFiles] = useState([
        {
            name: 'main.js',
            language: 'javascript',
            content: CODE_SNIPPETS['javascript'] || '// Start coding here...'
        }
    ]);

    const handleEndCall = () => {
        toast.info("Leaving meeting...");
        setTimeout(() => navigate('/mentor/dashboard'), 1000);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-100 font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b-4 border-black p-4 flex justify-between items-center shadow-[0px_4px_0px_0px_#000] z-20 relative">
                <div className="flex items-center gap-4">
                    <div className="bg-black text-white px-3 py-1 font-black uppercase text-sm">
                        Live Session
                    </div>
                    <div>
                        <h1 className="font-black text-lg leading-none">System Design Interview</h1>
                        <p className="text-xs font-bold text-gray-500">ID: {roomId} • 45:12 Elapsed</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-none border-2 border-black font-bold hidden md:flex">
                        <Share2 className="mr-2 h-4 w-4" /> Invite
                    </Button>
                    <Button variant="outline" className="rounded-none border-2 border-black font-bold">
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex min-h-0">

                {/* LEFT: Video & Participants */}
                <div className="w-1/3 border-r-4 border-black bg-gray-900 text-white flex flex-col overflow-hidden relative">
                    <iframe
                        allow="camera; microphone; fullscreen; display-capture; autoplay; speaker-selection; clipboard-write; encrypted-media; picture-in-picture; screen-wake-lock"
                        src={`https://meet.jit.si/SkillMeter-${roomId}`}
                        className="w-full h-full border-none"
                        title="Jitsi Meeting"
                    ></iframe>
                </div>

                {/* RIGHT: Collaboration Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Toolbar */}
                    <div className="border-b-2 border-black p-2 flex gap-2 bg-gray-50">
                        <Button
                            onClick={() => setActiveTab('code')}
                            className={`rounded-none border-2 border-black ${activeTab === 'code' ? 'bg-[#ff00ff] text-white hover:bg-[#d900d9]' : 'bg-white text-black hover:bg-gray-100'} font-bold shadow-[2px_2px_0px_0px_#000]`}
                        >
                            <Code className="mr-2 h-4 w-4" /> Code Editor
                        </Button>
                        <Button
                            onClick={() => setActiveTab('whiteboard')}
                            className={`rounded-none border-2 border-black ${activeTab === 'whiteboard' ? 'bg-[#ff00ff] text-white hover:bg-[#d900d9]' : 'bg-white text-black hover:bg-gray-100'} font-bold shadow-[2px_2px_0px_0px_#000]`}
                        >
                            <Layout className="mr-2 h-4 w-4" /> Whiteboard
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-gray-50 relative">
                        {activeTab === 'code' ? (
                            <div className="absolute inset-0 p-0">
                                <CodeEditor
                                    language={language}
                                    setLanguage={setLanguage}
                                    files={files}
                                    setFiles={setFiles}
                                />
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center border-dashed border-2 border-gray-300 m-4">
                                <div className="text-center text-gray-400">
                                    <Layout className="h-16 w-16 mx-auto mb-4" />
                                    <h3 className="font-bold text-lg">Interactive Whiteboard</h3>
                                    <p className="text-sm">Draw diagrams and key concepts here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Control Bar */}
            <div className="bg-white border-t-4 border-black p-4 flex justify-between items-center z-20">
                <div className="flex gap-4">
                    <Button variant="outline" className="rounded-full h-12 w-12 border-2 border-black hover:bg-gray-100 relative">
                        <MessageSquare className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-black font-bold">3</span>
                    </Button>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`rounded-full h-14 w-14 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all ${isMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-black hover:bg-gray-100'}`}
                    >
                        {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </Button>

                    <Button
                        onClick={() => setIsVideoOff(!isVideoOff)}
                        className={`rounded-full h-14 w-14 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all ${isVideoOff ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-black hover:bg-gray-100'}`}
                    >
                        {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                    </Button>

                    <Button
                        onClick={handleEndCall}
                        className="rounded-full px-8 h-14 bg-red-600 text-white border-2 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] hover:bg-red-700 transition-all ml-4"
                    >
                        <PhoneOff className="mr-2 h-6 w-6" /> End Call
                    </Button>
                </div>

                <div className="flex gap-4">
                    <Button variant="ghost" className="rounded-none font-bold">More <MoreVertical className="ml-2 h-4 w-4" /></Button>
                </div>
            </div>
        </div>
    );
}
