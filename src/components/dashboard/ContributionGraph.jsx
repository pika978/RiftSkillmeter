import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { startOfYear, eachDayOfInterval, format, getMonth, startOfWeek, addDays } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ContributionGraph() {
    const { authFetch } = useAuth();
    const [activityData, setActivityData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await authFetch('http://localhost:8000/api/activity/');
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

    // Generate days from start of current year to today
    const today = new Date();
    const yearStart = startOfYear(today);
    const days = eachDayOfInterval({ start: yearStart, end: today });

    // Group days into weeks (columns)
    const weeks = [];
    let currentWeek = [];
    const firstDayOfWeek = startOfWeek(yearStart).getDay(); // 0 = Sunday

    // Pad the first week with empty cells
    for (let i = 0; i < yearStart.getDay(); i++) {
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
        if (count === 1) return 'bg-emerald-300';
        if (count === 2) return 'bg-emerald-400';
        if (count === 3) return 'bg-emerald-500';
        return 'bg-emerald-600';
    };

    return (
        <Card>
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
                        <div className="flex gap-[3px] text-xs text-muted-foreground mb-1 pl-6">
                            {weeks.map((week, weekIndex) => {
                                const firstDayOfWeek = week.find(d => d !== null);
                                if (!firstDayOfWeek) return <div key={weekIndex} className="w-[10px]" />;

                                const month = getMonth(firstDayOfWeek);
                                const prevWeek = weeks[weekIndex - 1];
                                const prevMonth = prevWeek ? getMonth(prevWeek.find(d => d !== null) || firstDayOfWeek) : -1;

                                return (
                                    <div key={weekIndex} className="w-[10px] text-center">
                                        {month !== prevMonth ? months[month] : ''}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grid */}
                        <div className="flex gap-[3px]">
                            {/* Day labels */}
                            <div className="flex flex-col gap-[3px] text-xs text-muted-foreground pr-1">
                                <span className="h-[10px]"></span>
                                <span className="h-[10px] leading-[10px]">M</span>
                                <span className="h-[10px]"></span>
                                <span className="h-[10px] leading-[10px]">W</span>
                                <span className="h-[10px]"></span>
                                <span className="h-[10px] leading-[10px]">F</span>
                                <span className="h-[10px]"></span>
                            </div>

                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-[3px]">
                                    {week.map((day, dayIndex) => {
                                        if (!day) {
                                            return <div key={dayIndex} className="w-[10px] h-[10px]" />;
                                        }
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const count = activityData[dateStr] || 0;

                                        return (
                                            <TooltipProvider key={dateStr}>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <div className={`w-[10px] h-[10px] rounded-sm ${getColor(count)} hover:ring-1 hover:ring-ring transition-all`} />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{count} lessons on {format(day, 'MMM d, yyyy')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground justify-end">
                            <span>Less</span>
                            <div className="w-[10px] h-[10px] rounded-sm bg-muted/30" />
                            <div className="w-[10px] h-[10px] rounded-sm bg-emerald-300" />
                            <div className="w-[10px] h-[10px] rounded-sm bg-emerald-500" />
                            <div className="w-[10px] h-[10px] rounded-sm bg-emerald-600" />
                            <span>More</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
