import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookingModal from '../components/dashboard/BookingModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Video, Star, Clock, Calendar, CheckCircle2, Play, Smartphone, Linkedin, Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import api from '../api/api';

// --- MOCK DATA ---
const MENTORS = [
    {
        id: 1,
        name: 'Sarah Chen',
        role: 'Senior System Architect',
        company: 'Google',
        image: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sarah',
        skills: ['System Design', 'Scalability', 'Cloud Architecture'],
        rating: 4.9,
        reviews: 120,
        price: '₹10/min',
        availability: 'Mon, Wed, Fri',
        color: 'bg-[#ff6b6b]', // Red-ish
        linkedin: 'https://linkedin.com/in/sarahchen',
    },
    {
        id: 2,
        name: 'David Miller',
        role: 'Staff Engineer',
        company: 'Netflix',
        image: 'https://api.dicebear.com/7.x/lorelei/svg?seed=David',
        skills: ['React', 'Performance', 'Node.js'],
        rating: 4.8,
        reviews: 85,
        price: '₹8/min',
        availability: 'Tue, Thu',
        color: 'bg-[#4ecdc4]', // Teal
        linkedin: 'https://linkedin.com/in/davidmiller',
    },
    {
        id: 3,
        name: 'Emily Zhang',
        role: 'AI Researcher',
        company: 'OpenAI',
        image: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Emily',
        skills: ['Machine Learning', 'Python', 'LLMs'],
        rating: 5.0,
        reviews: 200,
        price: '₹12/min',
        availability: 'Weekends',
        color: 'bg-[#ffe66d]', // Yellow
        linkedin: 'https://linkedin.com/in/emilyzhang',
    },
    {
        id: 4,
        name: 'Michael Scott',
        role: 'Product Manager',
        company: 'Microsoft',
        image: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Michael',
        skills: ['Product Strategy', 'Interview Prep', 'Leadership'],
        rating: 4.7,
        reviews: 45,
        price: '₹5/min',
        availability: 'Flexible',
        color: 'bg-[#ff9f1c]', // Orange
        linkedin: 'https://linkedin.com/in/michaelscott',
    },
    {
        id: 5,
        name: 'Jessica Pearson',
        role: 'Legal Tech Lead',
        company: 'Pearson Specter',
        image: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Jessica',
        skills: ['Compliance', 'Data Privacy', 'Security'],
        rating: 4.9,
        reviews: 110,
        price: '₹15/min',
        availability: 'Mon-Fri',
        color: 'bg-[#ff006e]', // Pink
        linkedin: 'https://linkedin.com/in/jessicapearson',
    },
    {
        id: 6,
        name: 'Gilfoyle',
        role: 'DevOps Engineer',
        company: 'Pied Piper',
        image: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Gilfoyle',
        skills: ['Kubernetes', 'Security', 'Server Config'],
        rating: 5.0,
        reviews: 666,
        price: '₹20/min',
        availability: 'Never',
        color: 'bg-[#8338ec]', // Purple
        linkedin: 'https://linkedin.com/in/gilfoyle',
    }
];

const TRENDING_ARTICLES = [
    { title: "AI Takes Over Coding?", date: "Oct 12", tag: "Tech" },
    { title: "Why React is Dying (Again)", date: "Oct 10", tag: "Opinion" },
    { title: "Brutalism is Back, Baby!", date: "Oct 08", tag: "Design" },
    { title: "Rust vs Go: The Final War", date: "Oct 05", tag: "Dev" },
];

export default function MentorConnect() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('find-mentors');
    const [filter, setFilter] = useState('');
    const [selectedTopic, setSelectedTopic] = useState("Behavioral");
    const [experienceLevel, setExperienceLevel] = useState("mid");
    const [resumeFile, setResumeFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        setResumeFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Mentor Data State
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);

    // My Sessions State
    const [mySessions, setMySessions] = useState([]);

    // Booking Modal State
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState(null);

    // Fetch Mentors from Backend
    useEffect(() => {
        const fetchMentors = async () => {
            try {
                const res = await api.get('/mentors/');
                const mapped = res.data.map(m => ({
                    id: m.id,
                    name: `${m.firstName} ${m.lastName}`,
                    role: m.title,
                    company: m.company,
                    image: `https://api.dicebear.com/7.x/lorelei/svg?seed=${m.firstName}`,
                    skills: m.skills || [],
                    rating: m.averageRating || 5.0,
                    reviews: 0,
                    price: `₹${m.hourlyRate}/min`,
                    availability: 'Flexible',
                    color: 'bg-[#4ecdc4]',
                    linkedin: '#'
                }));
                setMentors(mapped);
            } catch (err) {
                console.error("Failed to fetch mentors", err);
                toast.error("Could not load mentors.");
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'find-mentors') {
            fetchMentors();
        }
    }, [activeTab]);

    // Fetch My Sessions
    useEffect(() => {
        const fetchMySessions = async () => {
            try {
                const res = await api.get('/bookings/my-sessions/');
                const mapped = res.data.map(b => ({
                    id: b.id,
                    mentor_name: b.mentorName || "Unknown Mentor",
                    topic: b.topic,
                    created_at: b.created_at,
                    status: b.status,
                    meeting_link: b.meetingLink
                }));
                setMySessions(mapped);
            } catch (err) {
                console.error("Failed to fetch my sessions", err);
            }
        };

        if (activeTab === 'my-sessions') {
            fetchMySessions();
        }
    }, [activeTab]);

    const handleConnect = (mentor) => {
        setSelectedMentor(mentor);
        setIsBookingOpen(true);
    };

    // Reset state when topic changes (if needed for simplified logic)
    useEffect(() => {
        // No local state to reset anymore
    }, [selectedTopic]);

    // Filter Mentors
    const filteredMentors = mentors.filter(m =>
        m.name.toLowerCase().includes(filter.toLowerCase()) ||
        m.skills.some(s => s.toLowerCase().includes(filter.toLowerCase()))
    );

    const startInterview = () => {
        if (!selectedTopic) {
            toast.error("Please enter a topic first.");
            return;
        }

        navigate('/interview-room', {
            state: {
                topic: selectedTopic,
                level: experienceLevel,
                resume: resumeFile
            }
        });
        toast.info("Launching Interview Room...");
    };

    return (
        <DashboardLayout>
            <div className={activeTab === 'find-mentors' ? "h-[170vh] flex flex-col overflow-hidden font-sans" : "space-y-6 max-w-7xl mx-auto px-4 lg:px-8 pb-12 font-sans"}>

                {/* Header Section */}
                <div className="flex-none flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-black pb-4 mb-6">
                    <div style={{ perspective: '1000px' }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ rotateX: -90, opacity: 0 }}
                                animate={{ rotateX: 0, opacity: 1 }}
                                exit={{ rotateX: 90, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="origin-top"
                            >
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif' }}>
                                    {activeTab === 'find-mentors' ? 'Mentor Connect' : activeTab === 'my-sessions' ? 'Sessions with Mentor' : 'AI Mock Interview'}
                                </h1>
                                <p className="text-lg font-bold text-gray-600 bg-yellow-300 inline-block px-2 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
                                    {activeTab === 'find-mentors'
                                        ? 'Find an expert • Master the interview • Get hired'
                                        : activeTab === 'my-sessions'
                                            ? 'Track your progress • Manage bookings • History'
                                            : 'Practice real questions • Record yourself • Get feedback'}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="rounded-none border-2 border-black px-3 py-1 font-bold bg-white text-black shadow-[4px_4px_0px_0px_#ff00ff]">
                            {MENTORS.length} Mentors Online
                        </Badge>
                    </div>
                </div>

                <Tabs defaultValue="find-mentors" className={activeTab === 'find-mentors' ? "flex-1 flex flex-col min-h-0" : "w-full space-y-8"} onValueChange={setActiveTab}>
                    <div className={activeTab === 'find-mentors' ? "flex-1 flex flex-col md:flex-row gap-8 items-start min-h-0" : "flex flex-col md:flex-row gap-8 items-start"}>

                        {/* LEFT COLUMN: Tabs + Trending News - Fixed & Scrollable Sidebar */}
                        <div className={activeTab === 'find-mentors' ? "flex flex-col gap-8 md:w-72 shrink-0 h-full overflow-y-auto no-scrollbar pb-4" : "flex flex-col gap-8 md:w-72 shrink-0"}>
                            {/* Navigation Tabs */}
                            <TabsList className="flex-col h-auto items-stretch bg-transparent space-gap-0 p-0 rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000] bg-white">
                                <TabsTrigger
                                    value="find-mentors"
                                    className="rounded-none justify-start md:px-6 px-4 py-4 text-base font-bold type-button data-[state=active]:bg-[#ff00ff] data-[state=active]:text-white border-b-2 border-black last:border-0 hover:bg-gray-100 transition-colors"
                                >
                                    <Search className="mr-3 h-5 w-5" /> Find Mentors
                                </TabsTrigger>
                                <TabsTrigger
                                    value="my-sessions"
                                    className="rounded-none justify-start md:px-6 px-4 py-4 text-base font-bold type-button data-[state=active]:bg-[#adfa1d] data-[state=active]:text-black border-b-2 border-black last:border-0 hover:bg-gray-100 transition-colors"
                                >
                                    <Clock className="mr-3 h-5 w-5" /> My Sessions
                                </TabsTrigger>
                                <TabsTrigger
                                    value="simulator"
                                    className="rounded-none justify-start md:px-6 px-4 py-4 text-base font-bold data-[state=active]:bg-[#ff9f1c] data-[state=active]:text-black hover:bg-gray-100 transition-colors"
                                >
                                    <Video className="mr-3 h-5 w-5" /> Simulator
                                </TabsTrigger>
                            </TabsList>

                            {/* Trending / Tips Sidebar */}
                            {/* Keep it simple: Always show Trending/News for now, or specific tips if simulator */}
                            <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_#ff0000] min-h-[400px] flex flex-col">
                                <div className="bg-black text-white p-3 border-b-2 border-black flex-none">
                                    <h3 className="font-black text-xl uppercase tracking-widest text-center">
                                        {activeTab === 'simulator' ? 'Pro Tips' : 'Trending'}
                                    </h3>
                                </div>
                                <div className="p-4 flex-1 overflow-y-auto">
                                    {activeTab === 'simulator' ? (
                                        <div className="space-y-4 text-sm font-bold">
                                            <div className="p-2 border-2 border-black bg-yellow-100 shadow-[2px_2px_0px_0px_#000]">
                                                Use the STAR method: Situation, Task, Action, Result.
                                            </div>
                                            <div className="p-2 border-2 border-black bg-green-100 shadow-[2px_2px_0px_0px_#000]">
                                                Speak clearly and maintain eye contact with the camera.
                                            </div>
                                            <div className="p-2 border-2 border-black bg-blue-100 shadow-[2px_2px_0px_0px_#000]">
                                                Review your transcript after the session to improve.
                                            </div>
                                        </div>
                                    ) : (
                                        <ul className="space-y-4">
                                            {TRENDING_ARTICLES.map((article, i) => (
                                                <li key={i} className="group cursor-pointer">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <Badge className="rounded-none bg-black text-white hover:bg-black border border-black text-[10px] px-1 py-0 uppercase">
                                                            {article.tag}
                                                        </Badge>
                                                        <span className="text-xs font-bold text-gray-500">{article.date}</span>
                                                    </div>
                                                    <h4 className="font-bold leading-tight group-hover:text-[#ff0000] transition-colors line-clamp-2">
                                                        {article.title}
                                                    </h4>
                                                    <div className="h-0.5 w-full bg-gray-200 mt-3 group-hover:bg-[#ff0000] transition-colors" />
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="p-3 border-t-2 border-black bg-gray-50 flex-none text-center">
                                    <a href="#" className="font-bold text-sm uppercase tracking-wider underline hover:text-[#ff0000]">
                                        View All {activeTab === 'simulator' ? 'Tips' : 'News'} →
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Content Area */}
                        <div className={activeTab === 'find-mentors' ? "flex-1 w-full min-w-0 h-full flex flex-col" : "flex-1 w-full min-w-0"}>

                            {/* TAB: FIND MENTORS */}
                            <TabsContent value="find-mentors" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=active]:flex">
                                {/* Search Bar - Fixed */}
                                <div className="flex-none flex gap-0 group shadow-[6px_6px_0px_0px_#4ecdc4] mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-3.5 h-6 w-6 text-black" />
                                        <Input
                                            placeholder="Search by name, company, or skill..."
                                            className="pl-12 rounded-none border-2 border-black h-14 text-lg font-bold placeholder:text-gray-400 focus-visible:ring-0 border-r-0 bg-white"
                                            value={filter}
                                            onChange={(e) => setFilter(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="ghost" className="rounded-none border-2 border-black h-14 px-8 bg-[#adfa1d] text-black hover:bg-[#8ce000] font-black text-lg tracking-tight uppercase">
                                        <Filter className="mr-2 h-5 w-5" /> Filter
                                    </Button>
                                </div>

                                {/* Mentor Grid - Scrollable */}
                                <div className="flex-1 overflow-y-auto pr-4 pb-4">
                                    <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        <AnimatePresence>
                                            {filteredMentors.map((mentor) => (
                                                <motion.div
                                                    key={mentor.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="group"
                                                >
                                                    <Card className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] hover:-translate-y-1 hover:-translate-x-1 transition-all duration-300 h-full flex flex-col bg-white overflow-hidden">
                                                        {/* Colorful Header */}
                                                        <div className={`relative h-20 ${mentor.color} border-b-2 border-black flex items-start justify-end p-2`}>
                                                            <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer" className="bg-white p-1 border-2 border-black hover:bg-blue-600 hover:text-white transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:shadow-none hover:-translate-y-0.5" title="Connect on LinkedIn">
                                                                <Linkedin className="h-4 w-4" />
                                                            </a>
                                                        </div>

                                                        <div className="px-6 -mt-10 mb-2 relative z-10">
                                                            <img
                                                                src={mentor.image}
                                                                alt={mentor.name}
                                                                className="w-20 h-20 rounded-none border-2 border-black object-cover bg-white shadow-[4px_4px_0px_0px_#000]"
                                                            />
                                                        </div>

                                                        <CardContent className="p-4 pt-2 flex-1 flex flex-col gap-4">
                                                            <div>
                                                                <h3 className="font-heading text-2xl font-black leading-tight mb-1">{mentor.name}</h3>
                                                                <p className="text-sm font-bold text-gray-600 flex items-center gap-1 uppercase tracking-tight">
                                                                    {mentor.role} <span className="text-black mx-1">@</span> {mentor.company}
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2">
                                                                {mentor.skills.slice(0, 3).map(skill => (
                                                                    <span key={skill} className="px-2 py-1 text-xs uppercase tracking-wider font-bold border-2 border-black bg-white hover:bg-black hover:text-white transition-colors">
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>

                                                            <div className="mt-auto pt-4 flex items-center justify-between border-t-2 border-dashed border-gray-300">
                                                                <div className="flex items-center gap-1.5 bg-yellow-300 px-2 py-1 border border-black shadow-[2px_2px_0px_0px_#000]">
                                                                    <Star className="h-4 w-4 fill-black text-black" />
                                                                    <span className="text-sm font-black">{mentor.rating}</span>
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    className="rounded-none border-2 border-black bg-black text-white hover:bg-[#ff00ff] hover:text-white font-bold tracking-wider uppercase shadow-[3px_3px_0px_0px_#888] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-y-[2px] transition-all"
                                                                    onClick={() => handleConnect(mentor)}
                                                                >
                                                                    Connect
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB: MY SESSIONS */}
                            <TabsContent value="my-sessions" className="flex-1 flex flex-col min-h-0 mt-0 data-[state=active]:flex overflow-y-auto">
                                <div className="max-w-4xl mx-auto w-full space-y-8">
                                    {/* Latest / Pending Request */}
                                    {mySessions.length > 0 && mySessions[0].status.toLowerCase() === 'pending' && (
                                        <Card className="rounded-none border-2 border-black shadow-[8px_8px_0px_0px_#000] bg-yellow-100">
                                            <CardHeader className="border-b-2 border-black">
                                                <CardTitle className="flex justify-between items-center text-black">
                                                    <span className="text-2xl font-black uppercase tracking-tighter">Latest Request</span>
                                                    <Badge className="rounded-none border-2 border-black bg-yellow-300 text-black font-bold uppercase shadow-[2px_2px_0px_0px_#000]">Pending Approval</Badge>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-black rounded-full translate-x-1 translate-y-1"></div>
                                                        <img src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${mySessions[0].mentor_name}`} alt="Mentor" className="relative w-24 h-24 rounded-full border-2 border-black bg-white" />
                                                    </div>
                                                    <div className="flex-1 text-center md:text-left space-y-2">
                                                        <h3 className="text-3xl font-black uppercase text-black">{mySessions[0].topic}</h3>
                                                        <p className="text-lg font-bold text-gray-800">with {mySessions[0].mentor_name}</p>
                                                        <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-bold mt-2">
                                                            <span className="flex items-center gap-1 bg-white px-2 border border-black"><Calendar className="h-4 w-4" /> {new Date(mySessions[0].created_at).toLocaleDateString()}</span>
                                                            <span className="flex items-center gap-1 bg-white px-2 border border-black"><Clock className="h-4 w-4" /> {new Date(mySessions[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                    <Button disabled className="rounded-none h-14 px-8 border-2 border-black bg-gray-300 text-gray-500 font-black uppercase tracking-wider text-xl cursor-not-allowed opacity-50">
                                                        Waiting for Accept...
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black uppercase border-b-4 border-black inline-block pb-1">All Activity</h3>
                                        <div className="grid gap-4">
                                            {mySessions.length === 0 ? (
                                                <div className="text-center p-8 border-2 border-dashed border-gray-300 text-gray-500 font-bold">
                                                    No sessions found. Book a mentor to get started!
                                                </div>
                                            ) : (
                                                mySessions.map((session) => (
                                                    <Card key={session.id} className="rounded-none border-2 border-black shadow-[4px_4px_0px_0px_#ccc] hover:shadow-[2px_2px_0px_0px_#000] transition-all bg-white">
                                                        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                                                            <div className="h-12 w-12 bg-gray-100 border-2 border-black rounded-full flex items-center justify-center font-black">
                                                                {session.mentor_name[0]}
                                                            </div>
                                                            <div className="flex-1 text-center md:text-left">
                                                                <h4 className="font-bold text-lg">{session.topic}</h4>
                                                                <p className="text-sm font-medium text-gray-500">with {session.mentor_name} • {new Date(session.created_at).toLocaleString()}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                                                                <Badge variant="outline" className={`rounded-none border-black uppercase ${session.status === 'CONFIRMED' ? 'bg-green-300 text-black' :
                                                                    session.status === 'CANCELLED' ? 'bg-red-200 text-red-700' : 'bg-yellow-200'
                                                                    }`}>
                                                                    {session.status}
                                                                </Badge>

                                                                {session.status === 'CONFIRMED' && session.meeting_link && (
                                                                    <Button
                                                                        onClick={() => navigate(`/room/${session.id}`)}
                                                                        className="rounded-none bg-black text-white hover:bg-[#adfa1d] hover:text-black border-2 border-black font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#888]"
                                                                    >
                                                                        Join Now
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB: SIMULATOR (NEW - Launchpad) */}
                            <TabsContent value="simulator" className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center bg-gray-50/50">
                                <Card className="w-full max-w-2xl mx-auto rounded-none border-2 border-black shadow-[8px_8px_0px_0px_#adfa1d] bg-white">
                                    <CardHeader className="border-b-2 border-black bg-black text-white p-6">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full bg-[#adfa1d] animate-pulse"></div>
                                                <CardTitle className="text-2xl font-black uppercase tracking-wider text-[#adfa1d]">
                                                    AI Simulation Setup
                                                </CardTitle>
                                            </div>
                                            <BrainCircuit className="h-8 w-8 text-white" />
                                        </div>
                                        <CardDescription className="text-gray-400 font-mono mt-2 uppercase tracking-wide">
                                            Configure your mock interview session
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">

                                        {/* Setup Form */}
                                        <div className="space-y-6">
                                            {/* Topic */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-black uppercase tracking-wide">Interview Topic</Label>
                                                <Input
                                                    value={selectedTopic}
                                                    onChange={(e) => setSelectedTopic(e.target.value)}
                                                    className="h-14 rounded-none border-2 border-black font-bold text-lg shadow-[4px_4px_0px_0px_#ccc] focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_#000] transition-all"
                                                    placeholder="E.g. System Design, React, Python..."
                                                />
                                                <p className="text-xs text-gray-500 font-bold">Type any tech stack or soft skill topic.</p>
                                            </div>

                                            {/* Level */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-black uppercase tracking-wide">Difficulty Level</Label>
                                                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                                                    <SelectTrigger className="h-14 rounded-none border-2 border-black font-bold text-lg shadow-[4px_4px_0px_0px_#ccc] focus:shadow-[4px_4px_0px_0px_#000] transition-all">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-none border-2 border-black font-bold">
                                                        <SelectItem value="junior">Junior (Beginner)</SelectItem>
                                                        <SelectItem value="mid">Mid-Level (Intermediate)</SelectItem>
                                                        <SelectItem value="senior">Senior (Advanced)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Resume */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-black uppercase tracking-wide">Resume (Optional)</Label>
                                                {/* Custom File Input */}
                                                <div
                                                    className="h-14 flex items-center border-2 border-black cursor-pointer bg-white hover:bg-gray-50 transition-colors shadow-[4px_4px_0px_0px_#ccc] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <div className="bg-black text-white h-full px-6 flex items-center justify-center font-black uppercase text-sm tracking-wider shrink-0">
                                                        Upload PDF
                                                    </div>
                                                    <div className="flex-1 px-4 font-bold uppercase text-sm truncate text-gray-500">
                                                        {resumeFile ? <span className="text-black">{resumeFile.name}</span> : "No file chosen"}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                        accept=".pdf,.doc,.docx"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t-2 border-dashed border-gray-300">
                                            <Button
                                                onClick={startInterview}
                                                disabled={!selectedTopic}
                                                className="w-full h-16 text-xl font-black uppercase tracking-widest bg-[#adfa1d] text-black hover:bg-[#8ce000] border-2 border-black shadow-[6px_6px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#000] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Launch Interview Room 🚀
                                            </Button>
                                            <p className="text-center text-xs font-mono text-gray-400 mt-4 uppercase">
                                                Opens in a dedicated immersive environment
                                            </p>
                                        </div>

                                    </CardContent>
                                </Card>
                            </TabsContent>

                        </div>
                    </div>
                </Tabs>
            </div >
            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                mentor={selectedMentor}
                onBookingComplete={() => setActiveTab('my-sessions')}
            />
        </DashboardLayout >
    );
}
