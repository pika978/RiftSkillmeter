// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'admin';
  createdAt: Date;
  onboardingCompleted: boolean;
}

// Onboarding types
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface OnboardingData {
  skillLevel: SkillLevel;
  knownLanguages: string[];
  knownTools: string[];
  learningGoal: string;
  dailyMinutes: number;
}

// Course & Roadmap types
export interface Concept {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  videoUrl?: string;
  notes?: string;
  completed: boolean;
  type: 'video' | 'reading' | 'practice';
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  concepts: Concept[];
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  difficulty: SkillLevel;
  estimatedHours: number;
  chapters: Chapter[];
  tags: string[];
}

export interface Roadmap {
  id: string;
  userId: string;
  course: Course;
  progress: number;
  currentChapter: number;
  currentConcept: number;
  startedAt: Date;
  lastAccessedAt: Date;
}

// Assessment types
export interface Question {
  id: string;
  type: 'mcq' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  conceptId: string;
}

export interface Assessment {
  id: string;
  conceptId: string;
  questions: Question[];
  timeLimit?: number; // in minutes
}

export interface AssessmentResult {
  id: string;
  assessmentId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: string; userAnswer: string; isCorrect: boolean }[];
  completedAt: Date;
}

// Progress & Analytics types
export interface DailyProgress {
  date: string;
  minutesLearned: number;
  conceptsCompleted: number;
  assessmentsTaken: number;
}

export interface UserProgress {
  userId: string;
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalMinutesLearned: number;
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  weakConcepts: string[];
  dailyProgress: DailyProgress[];
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'achievement' | 'missed' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// Task types
export interface Task {
  id: string;
  type: 'video' | 'notes' | 'assessment';
  title: string;
  conceptId: string;
  courseId: string;
  completed: boolean;
  dueDate?: Date;
}
