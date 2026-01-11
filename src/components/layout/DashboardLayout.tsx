import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { 
  LayoutDashboard, 
  Map, 
  BookOpen, 
  BarChart3, 
  Bell, 
  Settings,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
}

const sidebarLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Map, label: 'My Roadmap', href: '/roadmap' },
  { icon: BookOpen, label: 'Learning', href: '/learn' },
  { icon: BarChart3, label: 'Progress', href: '/progress' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 72 : 240 }}
          className="hidden lg:flex flex-col border-r border-border bg-card"
        >
          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-soft' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <link.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium">{link.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Collapse Button */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container py-6 lg:py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex items-center justify-around py-2">
          {sidebarLinks.slice(0, 5).map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                )}
              >
                <link.icon className="h-5 w-5" />
                <span className="text-xs">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
