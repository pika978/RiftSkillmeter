import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { startOfYear, eachDayOfInterval, format, getMonth, startOfWeek, addDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';

export function ContributionGraph() {
    const { authFetch } = useAuth();
    const [activityData, setActivityData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await authFetch('http://localhost:8001/api/activity/');
                if (res.ok) {
                    const data = await res.json();
                    console.log('[ContributionGraph] Activity data received:', data);
                    setActivityData(data);
                } else {
                    console.error('[ContributionGraph] API returned error:', res.status);
                }
            } catch (err) {
                console.error('[ContributionGraph] Failed to fetch activity log', err);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, [authFetch]);

    // Generate days for the trailing year (last 52 weeks)
    const today = new Date();
    const startDate = addDays(today, -364); // Exactly 52 weeks ago
    const days = eachDayOfInterval({ start: startDate, end: today });

    // Group days into weeks (columns)
    const weeks = [];
    let currentWeek = [];

    // Pad the first week based on the start date's day of week
    const firstDay = days[0];
    for (let i = 0; i < firstDay.getDay(); i++) {
        currentWeek.push(null);
    }

    days.forEach((day) => {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    // Generate month labels
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const getColor = (count) => {
        if (!count) return 'bg-muted/30';
        if (count === 1) return 'bg-primary/30';
        if (count === 2) return 'bg-primary/50';
        if (count === 3) return 'bg-primary/70';
        return 'bg-primary';
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.01,
            }
        }
    };

    const itemVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: (count) => ({
            scale: 1,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 20,
                // Add infinite pulse if there's activity
                ...(count > 0 && {
                    opacity: {
                        repeat: Infinity,
                        repeatType: "reverse",
                        duration: 2 + Math.random(), // Staggered pulse durations
                        ease: "easeInOut"
                    }
                })
            }
        })
    };

    return (
        <Card className="rounded-none border-2 border-black shadow-[6px_6px_0px_0px_#000]">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Learning Activity</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="h-24 flex items-center justify-center text-muted-foreground">
                        Loading activity...
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* Month labels */}
                        <div className="flex gap-[3px] text-[10px] text-muted-foreground mb-1 pl-8">
                            {weeks.map((week, weekIndex) => {
                                const firstDayOfWeek = week.find(d => d !== null);
                                if (!firstDayOfWeek) return <div key={weekIndex} className="w-[12px]" />;

                                const month = getMonth(firstDayOfWeek);
                                const prevWeek = weeks[weekIndex - 1];
                                const prevMonth = prevWeek ? getMonth(prevWeek.find(d => d !== null) || firstDayOfWeek) : -1;

                                return (
                                    <div key={weekIndex} className="w-[12px] text-center">
                                        {month !== prevMonth ? months[month] : ''}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grid */}
                        <div className="relative overflow-hidden">
                            {/* Radar Scan Bar */}
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "200%" }}
                                transition={{
                                    duration: 8,
                                    repeat: Infinity,
                                    ease: "linear",
                                    repeatDelay: 2
                                }}
                                className="absolute top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-r from-transparent via-primary/10 to-transparent skew-x-12"
                            />

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex gap-[3px]"
                            >
                                {/* Day labels */}
                                <div className="flex flex-col gap-[3px] text-[10px] text-muted-foreground pr-1 bg-white relative z-20">
                                    <span className="h-[12px]"></span>
                                    <span className="h-[12px] leading-[12px]">M</span>
                                    <span className="h-[12px]"></span>
                                    <span className="h-[12px] leading-[12px]">W</span>
                                    <span className="h-[12px]"></span>
                                    <span className="h-[12px] leading-[12px]">F</span>
                                    <span className="h-[12px]"></span>
                                </div>

                                {weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="flex flex-col gap-[3px]">
                                        {week.map((day, dayIndex) => {
                                            if (!day) {
                                                return <div key={dayIndex} className="w-[12px] h-[12px]" />;
                                            }
                                            const dateStr = format(day, 'yyyy-MM-dd');
                                            const count = activityData[dateStr] || 0;

                                            return (
                                                <TooltipProvider key={dateStr}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <motion.div
                                                                custom={count}
                                                                variants={itemVariants}
                                                                className={`w-[12px] h-[12px] rounded-none border-[0.5px] border-black/10 ${getColor(count)} hover:ring-1 hover:ring-black transition-all relative z-10`}
                                                            />
                                                        </TooltipTrigger>
                                                        <TooltipContent className="rounded-none border border-black bg-white text-black">
                                                            <p>{count} lessons on {format(day, 'MMM d, yyyy')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            );
                                        })}
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground justify-end">
                            <span>Less</span>
                            <div className="w-[12px] h-[12px] rounded-none bg-muted/30" />
                            <div className="w-[12px] h-[12px] rounded-none bg-primary/30" />
                            <div className="w-[12px] h-[12px] rounded-none bg-primary/70" />
                            <div className="w-[12px] h-[12px] rounded-none bg-primary" />
                            <span>More</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
