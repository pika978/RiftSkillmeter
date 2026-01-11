import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLearning } from '@/contexts/LearningContext';
import { Bell, Trophy, AlertCircle, Info, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const { notifications, markNotificationRead } = useLearning();

  const icons = { reminder: Bell, achievement: Trophy, missed: AlertCircle, system: Info };
  const colors = { reminder: 'text-primary', achievement: 'text-yellow-500', missed: 'text-destructive', system: 'text-muted-foreground' };

  const filterByType = (type?: string) => type ? notifications.filter(n => n.type === type) : notifications;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your learning</p>
        </motion.div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="reminder">Reminders</TabsTrigger>
            <TabsTrigger value="achievement">Achievements</TabsTrigger>
          </TabsList>

          {['all', 'reminder', 'achievement'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {filterByType(tab === 'all' ? undefined : tab).map((notif) => {
                const Icon = icons[notif.type];
                return (
                  <Card
                    key={notif.id}
                    className={cn('cursor-pointer transition-colors', !notif.read && 'border-primary/50 bg-primary/5')}
                    onClick={() => markNotificationRead(notif.id)}
                  >
                    <CardContent className="p-4 flex gap-4">
                      <div className={cn('h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0', colors[notif.type])}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{notif.title}</h3>
                          {!notif.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(notif.createdAt, { addSuffix: true })}</p>
                      </div>
                      {notif.read && <Check className="h-4 w-4 text-muted-foreground shrink-0" />}
                    </CardContent>
                  </Card>
                );
              })}
              {filterByType(tab === 'all' ? undefined : tab).length === 0 && (
                <p className="text-center text-muted-foreground py-8">No notifications</p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
