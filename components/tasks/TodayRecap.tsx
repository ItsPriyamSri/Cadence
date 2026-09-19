'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/lib/firebase/firestore';
import { todayRecapItems, RecapItem } from '@/lib/habits/logic';
import { formatDateKey, formatElapsed } from '@/lib/utils/dates';
import { Clock, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface TodayRecapProps {
    tasks: Task[];
}

export function TodayRecap({ tasks }: TodayRecapProps) {
    const [nowMs, setNowMs] = useState(Date.now());
    const todayKey = formatDateKey(new Date());

    // Update every second for live elapsed clocks
    useEffect(() => {
        const interval = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const items: RecapItem[] = todayRecapItems(tasks, todayKey, nowMs);
    const totalMs = items.reduce((sum, item) => sum + item.elapsedMs, 0);

    if (items.length === 0) return null;

    return (
        <div className="mt-8 pt-5 border-t border-border space-y-3">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-text-tertiary" />
                    <span className="text-xs font-bold tracking-[0.06em] uppercase text-text-tertiary">
                        Today’s Recap
                    </span>
                </div>
                <span className="font-mono text-sm font-bold text-text-secondary tabular-nums">
                    {formatElapsed(Math.floor(totalMs / 1000))}
                </span>
            </div>

            <div className="space-y-2">
                {items.map((item) => {
                    const elapsedSecs = Math.floor(item.elapsedMs / 1000);
                    const isFinished = !item.inProgress;

                    return (
                        <div
                            key={item.taskId}
                            className={cn(
                                'flex items-center gap-3 p-3.5 rounded-lg bg-bg-primary border border-border shadow-elev-1 transition-opacity',
                                isFinished && 'opacity-70'
                            )}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'text-sm font-semibold truncate text-text-primary',
                                            isFinished && item.kind === 'oneoff' && 'line-through text-text-secondary'
                                        )}
                                    >
                                        {item.title}
                                    </span>

                                    {item.kind === 'habit' && (
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0',
                                                item.level === 2
                                                    ? 'bg-done-bg text-done'
                                                    : item.level === 1
                                                      ? 'bg-started-bg text-started'
                                                      : 'bg-bg-secondary text-text-tertiary'
                                            )}
                                        >
                                            <Repeat className="w-2.5 h-2.5" />
                                            {item.level === 2
                                                ? 'Full'
                                                : item.level === 1
                                                  ? 'Partial'
                                                  : 'Habit'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {item.inProgress && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-started-bg text-started text-xs font-bold shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-started animate-cad-live" />
                                    In progress
                                </span>
                            )}

                            <span className="font-mono text-sm font-bold text-text-secondary tabular-nums shrink-0">
                                {formatElapsed(elapsedSecs)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
