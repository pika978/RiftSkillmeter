import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Map, BookOpen, BarChart3, Bell, Settings, User, ChevronLeft, ChevronRight, LogOut, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const sidebarLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Map, label: 'My Roadmap', href: '/roadmap' },
  { icon: BookOpen, label: 'Learning', href: '/learn' },
  { icon: BarChart3, label: 'Progress', href: '/progress' },
  { icon: FlaskConical, label: 'Practice Lab', href: '/practice-lab' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function DashboardLayout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (<div className="h-screen overflow-hidden flex bg-background">
    {/* Sidebar - Desktop */}
    <aside className="hidden lg:flex flex-col border-r border-border bg-card w-60 h-full overflow-y-auto">
      {/* Logo Section */}
      <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="SkillMeter"
            className="h-9 w-9 object-contain shrink-0"
          />
          <span className="font-heading font-semibold text-lg">SkillMeter</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {sidebarLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (<Link key={link.href} to={link.href} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200', isActive
            ? 'bg-primary text-primary-foreground shadow-soft'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
            <link.icon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{link.label}</span>
          </Link>);
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-border sticky bottom-0 bg-card z-10">
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={logout}>
          <LogOut className="h-4 w-4 mr-2" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>

    {/* Main Content */}
    <main className="flex-1 h-full overflow-y-auto bg-background/50">
      <div className="container mx-auto py-6 lg:py-8 max-w-7xl">
        {children}
      </div>
    </main>

    {/* Mobile Bottom Navigation */}
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="flex items-center justify-around py-2">
        {sidebarLinks.slice(0, 5).map((link) => {
          const isActive = location.pathname === link.href;
          return (<Link key={link.href} to={link.href} className={cn('flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors', isActive
            ? 'text-primary'
            : 'text-muted-foreground')}>
            <link.icon className="h-5 w-5" />
            <span className="text-xs">{link.label}</span>
          </Link>);
        })}
      </div>
    </nav>
  </div>
  );
}
