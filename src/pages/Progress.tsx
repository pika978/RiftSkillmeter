import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLearning } from '@/contexts/LearningContext';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Flame, Trophy, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Progress() {
  const { userProgress } = useLearning();

  const stats = [
    { icon: Flame, label: 'Current Streak', value: `${userProgress.currentStreak} days`, color: 'text-orange-500' },
    { icon: Trophy, label: 'Best Streak', value: `${userProgress.longestStreak} days`, color: 'text-yellow-500' },
    { icon: Clock, label: 'Total Time', value: `${Math.round(userProgress.totalMinutesLearned / 60)}h`, color: 'text-primary' },
    { icon: BookOpen, label: 'Avg Score', value: `${userProgress.averageScore}%`, color: 'text-success' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold">Your Progress</h1>
          <p className="text-muted-foreground">Track your learning journey</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Minutes learned per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userProgress.dailyProgress}>
                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short' })} />
                    <YAxis />
                    <Bar dataKey="minutesLearned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Score Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Concepts Completed</CardTitle>
              <CardDescription>Daily progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userProgress.dailyProgress}>
                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short' })} />
                    <YAxis />
                    <Line type="monotone" dataKey="conceptsCompleted" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weak Areas */}
        {userProgress.weakConcepts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Areas to Improve
              </CardTitle>
              <CardDescription>Based on your assessment scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userProgress.weakConcepts.map((concept) => (
                  <span key={concept} className="px-3 py-1 bg-warning/10 text-warning rounded-full text-sm">
                    {concept}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
