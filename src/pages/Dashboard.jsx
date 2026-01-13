import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useLearning } from '@/contexts/LearningContext';
import { PlayCircle, FileText, CheckSquare, Flame, Trophy, ArrowRight, BookOpen, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContributionGraph } from '@/components/dashboard/ContributionGraph';

export default function Dashboard() {
  const { user } = useAuth();
  const { currentRoadmap, roadmaps, setCurrentRoadmap, userProgress, todaysTasks } = useLearning();
  const navigate = useNavigate();
  const taskIcons = { video: PlayCircle, notes: FileText, assessment: CheckSquare };

  // Default values for when userProgress is null/loading
  const stats = userProgress || {
    currentStreak: 0,
    averageScore: 0,
    totalMinutesLearned: 0,
    totalCoursesEnrolled: 0,
  };

  const taskList = todaysTasks || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold">
            Welcome back, {user?.name?.split(' ')[0] || 'Learner'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Continue your learning journey.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Flame, label: 'Day Streak', value: stats.currentStreak, color: 'text-orange-500' },
            { icon: Trophy, label: 'Avg Score', value: `${stats.averageScore}%`, color: 'text-yellow-500' },
            { icon: BookOpen, label: 'Minutes Learned', value: stats.totalMinutesLearned, color: 'text-primary' },
            { icon: CheckSquare, label: 'Courses', value: stats.totalCoursesEnrolled, color: 'text-success' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Current Course */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Current Course</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              {currentRoadmap ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={currentRoadmap.course?.thumbnail}
                      alt={currentRoadmap.course?.title}
                      className="w-24 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold">{currentRoadmap.course?.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {currentRoadmap.course?.description}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{currentRoadmap.progress}%</span>
                    </div>
                    <Progress value={currentRoadmap.progress} className="h-2" />
                  </div>
                  <Button onClick={() => navigate('/learn')} className="w-full">
                    Continue Learning <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No active course. Start your learning journey!</p>
                  <Button onClick={() => navigate('/onboarding')}>Get Started</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Tasks</CardTitle>
              <CardDescription>Complete these to maintain your streak</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {taskList.length > 0 ? taskList.map((task) => {
                const Icon = taskIcons[task.type] || CheckSquare;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate('/learn')}
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-sm flex-1">{task.title}</span>
                  </div>
                );
              }) : (
                <p className="text-sm text-muted-foreground text-center py-4">All caught up! 🎉</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contribution Graph */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ContributionGraph />
        </motion.div>

        {/* My Courses Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>All your enrolled courses</CardDescription>
            </div>
            <Button onClick={() => navigate('/onboarding')} variant="outline" size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Course
            </Button>
          </CardHeader>
          <CardContent>
            {roadmaps && roadmaps.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roadmaps.map((roadmap) => (
                  <motion.div
                    key={roadmap.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setCurrentRoadmap(roadmap)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${currentRoadmap?.id === roadmap.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={roadmap.course?.thumbnail || '/placeholder-course.jpg'}
                        alt={roadmap.course?.title}
                        className="w-16 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{roadmap.course?.title}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{roadmap.course?.difficulty}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{roadmap.progress || 0}%</span>
                      </div>
                      <Progress value={roadmap.progress || 0} className="h-1.5" />
                    </div>
                    {currentRoadmap?.id === roadmap.id && (
                      <div className="mt-2 text-xs text-primary font-medium">✓ Active Course</div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No courses yet. Start your first learning journey!</p>
                <Button onClick={() => navigate('/onboarding')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Course
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}