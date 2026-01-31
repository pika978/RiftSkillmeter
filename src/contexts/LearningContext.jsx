import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const LearningContext = createContext(undefined);
const API_URL = 'http://localhost:8001/api';

export function LearningProvider({ children }) {
    const { user, authFetch } = useAuth();
    const [courses, setCourses] = useState([]);
    const [roadmaps, setRoadmaps] = useState([]);
    const [currentRoadmap, setCurrentRoadmap] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all data when user loads
    useEffect(() => {
        if (user) {
            fetchInitialData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [
                coursesRes,
                roadmapsRes,
                progressRes,
                notifRes,
                tasksRes
            ] = await Promise.all([
                fetch(`${API_URL}/courses/`), // Public
                authFetch(`${API_URL}/roadmaps/`),
                authFetch(`${API_URL}/progress/`),
                authFetch(`${API_URL}/notifications/`),
                authFetch(`${API_URL}/tasks/`)
            ]);

            if (coursesRes.ok) setCourses(await coursesRes.json());

            if (roadmapsRes.ok) {
                const roadmapsData = await roadmapsRes.json();
                setRoadmaps(roadmapsData);
                // Set the first roadmap as current if we have any and no current is set
                if (roadmapsData.length > 0 && !currentRoadmap) {
                    setCurrentRoadmap(roadmapsData[0]);
                }
            }

            if (progressRes.ok) setUserProgress(await progressRes.json());
            if (notifRes.ok) setNotifications(await notifRes.json());
            if (tasksRes.ok) setTasks(await tasksRes.json());

        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateRoadmap = async (topic, skillLevel = 'beginner') => {
        try {
            const response = await authFetch(`${API_URL}/roadmaps/generate/`, {
                method: 'POST',
                body: JSON.stringify({
                    topic,
                    skillLevel
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate roadmap');
            }

            const newRoadmap = await response.json();
            setRoadmaps(prev => [newRoadmap, ...prev]);
            setCurrentRoadmap(newRoadmap);
            return newRoadmap;
        } catch (error) {
            console.error('Generate roadmap error:', error);
            throw error;
        }
    };

    const markConceptComplete = async (conceptId) => {
        try {
            const response = await authFetch(`${API_URL}/concepts/${conceptId}/complete/`, {
                method: 'POST',
            });

            if (response.ok) {
                // Refresh roadmaps to get updated progress
                const roadmapsRes = await authFetch(`${API_URL}/roadmaps/`);
                if (roadmapsRes.ok) {
                    const updatedRoadmaps = await roadmapsRes.json();
                    setRoadmaps(updatedRoadmaps);
                    // Update current roadmap if it matches and return it
                    if (currentRoadmap) {
                        const updated = updatedRoadmaps.find(r => r.id === currentRoadmap.id);
                        if (updated) {
                            setCurrentRoadmap(updated);
                            return updated; // Return the updated roadmap
                        }
                    }
                }

                // Update stats
                const progressRes = await authFetch(`${API_URL}/progress/`);
                if (progressRes.ok) setUserProgress(await progressRes.json());
            }
            return null;
        } catch (error) {
            console.error('Mark complete error:', error);
            return null;
        }
    };

    const submitAssessment = async (assessmentId, score, answers) => {
        try {
            const response = await authFetch(`${API_URL}/assessments/${assessmentId}/submit/`, {
                method: 'POST',
                body: JSON.stringify({ score, answers }),
            });

            if (response.ok) {
                // Refresh progress/stats
                const progressRes = await authFetch(`${API_URL}/progress/`);
                if (progressRes.ok) setUserProgress(await progressRes.json());

                // Refresh tasks (if an assessment task was completed)
                const tasksRes = await authFetch(`${API_URL}/tasks/`);
                if (tasksRes.ok) setTasks(await tasksRes.json());
            }
            return await response.json();
        } catch (error) {
            console.error('Submit assessment error:', error);
            throw error;
        }
    };

    const markNotificationRead = async (id) => {
        try {
            const response = await authFetch(`${API_URL}/notifications/${id}/read/`, {
                method: 'POST',
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            }
        } catch (error) {
            console.error('Mark notification read error:', error);
        }
    };

    const markTaskComplete = async (id) => {
        try {
            const response = await authFetch(`${API_URL}/tasks/${id}/complete/`, {
                method: 'POST',
            });

            if (response.ok) {
                setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
            }
        } catch (error) {
            console.error('Mark task complete error:', error);
        }
    };

    const updateProgress = () => {
        // This is now handled by the backend automatically when actions occur
        fetchInitialData();
    };

    // Select a specific concept to view in Learn page
    const selectConcept = (chapterIndex, conceptIndex) => {
        setCurrentRoadmap(prev => {
            if (!prev) return null;
            return {
                ...prev,
                currentChapter: chapterIndex,
                currentConcept: conceptIndex
            };
        });
    };

    const unreadNotifications = notifications.filter(n => !n.read).length;
    const todaysTasks = tasks.filter(t => !t.completed).slice(0, 3);

    return (
        <LearningContext.Provider value={{
            courses,
            roadmaps,
            currentRoadmap,
            userProgress,
            notifications,
            unreadNotifications,
            tasks,
            todaysTasks,
            loading,
            setCurrentRoadmap,
            generateRoadmap,
            markConceptComplete,
            selectConcept,
            submitAssessment,
            markNotificationRead,
            markTaskComplete,
            updateProgress,
        }}>
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
