import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLearning } from '@/contexts/LearningContext';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { Flame, Trophy, Clock, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Progress() {
  const { userProgress, loading: contextLoading } = useLearning();
  const [leaderboard, setLeaderboard] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loadingWidgets, setLoadingWidgets] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokens = JSON.parse(localStorage.getItem('skillmeter_tokens') || '{}');
        const headers = tokens.access ? { 'Authorization': `Bearer ${tokens.access}` } : {};

        const [leaderboardRes, trendingRes] = await Promise.all([
          fetch('http://localhost:8000/api/leaderboard/', { headers }),
          fetch('http://localhost:8000/api/trending/', { headers })
        ]);

        if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
        if (trendingRes.ok) setTrending(await trendingRes.json());
      } catch (error) {
        console.error("Failed to fetch widgets:", error);
      } finally {
        setLoadingWidgets(false);
      }
    };

    fetchData();
  }, []);

  // Default values when userProgress is null/loading
  const progress = userProgress || {
    currentStreak: 0,
    longestStreak: 0,
    totalMinutesLearned: 0,
    averageScore: 0,
    dailyProgress: [],
    weakConcepts: []
  };

  const stats = [
    { icon: Flame, label: 'Current Streak', value: `${progress.currentStreak || 0} days`, color: 'text-orange-500' },
    { icon: Trophy, label: 'Best Streak', value: `${progress.longestStreak || 0} days`, color: 'text-yellow-500' },
    { icon: Clock, label: 'Total Time', value: `${Math.round((progress.totalMinutesLearned || 0) / 60)}h`, color: 'text-primary' },
    { icon: BookOpen, label: 'Your Rank', value: progress.rank ? `#${progress.rank}` : 'N/A', color: 'text-success' },
  ];

  if (contextLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (<DashboardLayout>
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-3xl font-bold">Your Progress</h1>
        <p className="text-muted-foreground">Track your learning journey</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (<motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
          <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-none flex items-center justify-center border border-black ${stat.color} bg-transparent`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Weekly Activity */}
        <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Minutes learned per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progress.dailyProgress}>
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short' })} />
                  <YAxis />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                    contentStyle={{ borderRadius: '0px', border: '2px solid black', boxShadow: '4px 4px 0px 0px #000' }}
                  />
                  <Bar dataKey="minutesLearned" fill="black" radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Trend */}
        <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
          <CardHeader>
            <CardTitle>Concepts Completed</CardTitle>
            <CardDescription>Daily progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progress.dailyProgress}>
                  <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short' })} />
                  <YAxis />
                  <Tooltip
                    contentStyle={{ borderRadius: '0px', border: '2px solid black', boxShadow: '4px 4px 0px 0px #000' }}
                  />
                  <Line type="monotone" dataKey="conceptsCompleted" stroke="black" strokeWidth={2} dot={{ fill: 'white', stroke: 'black', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard & Trending Topics */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top 5 Leaderboard */}
        <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Rankers
            </CardTitle>
            <CardDescription>This week's top learners</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWidgets ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6" /></div>
            ) : (
              <div className="space-y-2">
                {leaderboard.length > 0 ? leaderboard.map((user) => (
                  <div key={user.rank} className={`flex items-center justify-between p-2 border border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer ${user.rank === 1 ? 'bg-yellow-50' : 'bg-white'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold w-6">{user.badge}</span>
                      <span className="font-medium text-sm">{user.name}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-primary">{user.points.toLocaleString()} pts</span>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No rankings yet.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trending Topics */}
        <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Trending Topics
            </CardTitle>
            <CardDescription>What learners are studying now</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWidgets ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6" /></div>
            ) : (
              <div className="space-y-2">
                {trending.length > 0 ? trending.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border border-black bg-white shadow-[3px_3px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">
                    <div>
                      <p className="font-medium text-sm">{item.topic}</p>
                      <p className="text-xs text-muted-foreground">{item.learners.toLocaleString()} learners</p>
                    </div>
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 border border-green-200">{item.growth}</span>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No trending topics yet.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weak Areas */}
      {progress.weakConcepts && progress.weakConcepts.length > 0 && (<Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-black" />
            Areas to Improve
          </CardTitle>
          <CardDescription>Based on your assessment scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {progress.weakConcepts.map((concept) => (<span key={concept} className="px-3 py-1 border border-black text-black rounded-none text-sm bg-transparent">
              {concept}
            </span>))}
          </div>
        </CardContent>
      </Card>)}
    </div>
  </DashboardLayout>);
}
