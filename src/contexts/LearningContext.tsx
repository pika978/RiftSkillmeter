import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Course, Roadmap, AssessmentResult, UserProgress, Notification, Task } from '@/types';
import { mockCourses, mockRoadmaps, mockUserProgress, mockNotifications, mockTasks } from '@/data/mockData';
import { useAuth } from './AuthContext';

interface LearningContextType {
  courses: Course[];
  roadmaps: Roadmap[];
  currentRoadmap: Roadmap | null;
  userProgress: UserProgress;
  notifications: Notification[];
  unreadNotifications: number;
  tasks: Task[];
  todaysTasks: Task[];
  
  // Actions
  setCurrentRoadmap: (roadmap: Roadmap | null) => void;
  generateRoadmap: (courseId: string) => Promise<Roadmap>;
  markConceptComplete: (conceptId: string) => void;
  submitAssessment: (result: Omit<AssessmentResult, 'id' | 'completedAt'>) => void;
  markNotificationRead: (id: string) => void;
  markTaskComplete: (id: string) => void;
  updateProgress: (minutes: number) => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

const ROADMAPS_KEY = 'skillmeter_roadmaps';
const PROGRESS_KEY = 'skillmeter_progress';

export function LearningProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [courses] = useState<Course[]>(mockCourses);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [currentRoadmap, setCurrentRoadmap] = useState<Roadmap | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>(mockUserProgress);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  // Load persisted data
  useEffect(() => {
    const storedRoadmaps = localStorage.getItem(ROADMAPS_KEY);
    const storedProgress = localStorage.getItem(PROGRESS_KEY);
    
    if (storedRoadmaps) {
      try {
        const parsed = JSON.parse(storedRoadmaps);
        setRoadmaps(parsed.map((r: any) => ({
          ...r,
          startedAt: new Date(r.startedAt),
          lastAccessedAt: new Date(r.lastAccessedAt),
        })));
      } catch (e) {
        setRoadmaps(mockRoadmaps);
      }
    } else {
      setRoadmaps(mockRoadmaps);
    }
    
    if (storedProgress) {
      try {
        setUserProgress(JSON.parse(storedProgress));
      } catch (e) {
        setUserProgress(mockUserProgress);
      }
    }
  }, []);

  // Persist roadmaps
  useEffect(() => {
    if (roadmaps.length > 0) {
      localStorage.setItem(ROADMAPS_KEY, JSON.stringify(roadmaps));
    }
  }, [roadmaps]);

  // Persist progress
  useEffect(() => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(userProgress));
  }, [userProgress]);

  const generateRoadmap = async (courseId: string): Promise<Roadmap> => {
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const course = courses.find(c => c.id === courseId);
    if (!course) throw new Error('Course not found');
    
    const newRoadmap: Roadmap = {
      id: `roadmap-${Date.now()}`,
      userId: user?.id || 'guest',
      course,
      progress: 0,
      currentChapter: 0,
      currentConcept: 0,
      startedAt: new Date(),
      lastAccessedAt: new Date(),
    };
    
    setRoadmaps(prev => [...prev, newRoadmap]);
    setCurrentRoadmap(newRoadmap);
    
    return newRoadmap;
  };

  const markConceptComplete = (conceptId: string) => {
    if (!currentRoadmap) return;
    
    // Update the course's concept as completed
    const updatedCourse = { ...currentRoadmap.course };
    let found = false;
    let totalConcepts = 0;
    let completedConcepts = 0;
    
    updatedCourse.chapters = updatedCourse.chapters.map(chapter => ({
      ...chapter,
      concepts: chapter.concepts.map(concept => {
        totalConcepts++;
        if (concept.id === conceptId) {
          found = true;
          completedConcepts++;
          return { ...concept, completed: true };
        }
        if (concept.completed) completedConcepts++;
        return concept;
      }),
    }));
    
    if (!found) return;
    
    const newProgress = Math.round((completedConcepts / totalConcepts) * 100);
    
    const updatedRoadmap: Roadmap = {
      ...currentRoadmap,
      course: updatedCourse,
      progress: newProgress,
      lastAccessedAt: new Date(),
    };
    
    setCurrentRoadmap(updatedRoadmap);
    setRoadmaps(prev => prev.map(r => r.id === updatedRoadmap.id ? updatedRoadmap : r));
    
    // Update user progress
    setUserProgress(prev => ({
      ...prev,
      totalMinutesLearned: prev.totalMinutesLearned + 15,
    }));
  };

  const submitAssessment = (result: Omit<AssessmentResult, 'id' | 'completedAt'>) => {
    const fullResult: AssessmentResult = {
      ...result,
      id: `result-${Date.now()}`,
      completedAt: new Date(),
    };
    
    // Update average score
    setUserProgress(prev => ({
      ...prev,
      averageScore: Math.round((prev.averageScore + result.score) / 2),
    }));
    
    // Mark related task as complete
    const relatedTask = tasks.find(t => t.conceptId === result.assessmentId && t.type === 'assessment');
    if (relatedTask) {
      markTaskComplete(relatedTask.id);
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markTaskComplete = (id: string) => {
    setTasks(prev => 
      prev.map(t => t.id === id ? { ...t, completed: true } : t)
    );
  };

  const updateProgress = (minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    
    setUserProgress(prev => {
      const dailyProgress = [...prev.dailyProgress];
      const todayIndex = dailyProgress.findIndex(d => d.date === today);
      
      if (todayIndex >= 0) {
        dailyProgress[todayIndex] = {
          ...dailyProgress[todayIndex],
          minutesLearned: dailyProgress[todayIndex].minutesLearned + minutes,
        };
      } else {
        dailyProgress.push({
          date: today,
          minutesLearned: minutes,
          conceptsCompleted: 0,
          assessmentsTaken: 0,
        });
      }
      
      return {
        ...prev,
        totalMinutesLearned: prev.totalMinutesLearned + minutes,
        dailyProgress,
      };
    });
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const todaysTasks = tasks.filter(t => !t.completed).slice(0, 3);

  return (
    <LearningContext.Provider
      value={{
        courses,
        roadmaps,
        currentRoadmap,
        userProgress,
        notifications,
        unreadNotifications,
        tasks,
        todaysTasks,
        setCurrentRoadmap,
        generateRoadmap,
        markConceptComplete,
        submitAssessment,
        markNotificationRead,
        markTaskComplete,
        updateProgress,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}
