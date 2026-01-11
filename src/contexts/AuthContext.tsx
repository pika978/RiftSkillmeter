import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, OnboardingData } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: (data: OnboardingData) => void;
  onboardingData: OnboardingData | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'skillmeter_auth';
const ONBOARDING_KEY = 'skillmeter_onboarding';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    // Check for stored auth
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
        });
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    if (storedOnboarding) {
      try {
        setOnboardingData(JSON.parse(storedOnboarding));
      } catch (e) {
        localStorage.removeItem(ONBOARDING_KEY);
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check against mock users or any email for demo
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser || email.includes('@')) {
      const userToSet = foundUser || {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'student' as const,
        createdAt: new Date(),
        onboardingCompleted: false,
      };
      
      setUser(userToSet);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userToSet));
      return true;
    }
    
    return false;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      role: 'student',
      createdAt: new Date(),
      onboardingCompleted: false,
    };
    
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    setOnboardingData(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ONBOARDING_KEY);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  const completeOnboarding = (data: OnboardingData) => {
    setOnboardingData(data);
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
    
    if (user) {
      updateUser({ onboardingCompleted: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
        completeOnboarding,
        onboardingData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
