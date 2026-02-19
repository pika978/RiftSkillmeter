import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LearningProvider } from "@/contexts/LearningContext";
import ProtectedRoute from "@/components/ProtectedRoute";
// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Roadmap from "./pages/Roadmap";
import Learn from "./pages/Learn";
import Progress from "./pages/Progress";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import PracticeLab from "./pages/PracticeLab";
import StudyRoom from "./pages/StudyRoom";
import MentorConnect from './pages/MentorConnect';
import MentorDashboard from "./pages/MentorDashboard";
import MeetingRoom from "./pages/MeetingRoom";
import VerifyCertificate from "./pages/VerifyCertificate";
import GeminiLiveLab from "./pages/GeminiLiveLab";
import InterviewRoom from "./pages/InterviewRoom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { toast } from "sonner";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001/api');
    fetch(`${API_URL}/hello/`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data.message);
        toast.success("Backend Connected", { description: data.message });
      })
      .catch((err) => {
        console.error("Backend connection failed:", err);
        toast.error("Backend Disconnected", { description: "Is Django running?" });
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LearningProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/verify" element={<VerifyCertificate />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/roadmap" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
                <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/practice-lab" element={<ProtectedRoute><PracticeLab /></ProtectedRoute>} />
                <Route path="/study-room" element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} />
                <Route path="/mentor-connect" element={<ProtectedRoute><MentorConnect /></ProtectedRoute>} />
                <Route path="/mentor/dashboard" element={<ProtectedRoute><MentorDashboard /></ProtectedRoute>} />
                <Route path="/room/:roomId" element={<ProtectedRoute><MeetingRoom /></ProtectedRoute>} />
                <Route path="/gemini-lab" element={<ProtectedRoute><GeminiLiveLab /></ProtectedRoute>} />
                <Route path="/interview-room" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LearningProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
export default App;
