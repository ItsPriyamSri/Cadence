'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Repeat } from 'lucide-react';
import { Task, RepeatRule } from '@/lib/firebase/firestore';
import { ContributionGraph, rollingDays, LIST_COLS, LIST_DAYS } from './ContributionGraph';
import { IntensityChooser } from './IntensityChooser';
import { parseDateKey } from '@/lib/habits/logic';
import { addDays, formatDateKey, formatShortDate } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

interface HabitRowProps {
    habit: Task;
    todayKey?: string;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getRepeatDescription(rule: RepeatRule): string {
    switch (rule.kind) {
        case 'daily':
            return 'Daily';
        case 'everyN':
            return `Every ${rule.n} days`;
        case 'weekdays':
            return rule.days.map((d) => WEEKDAY_NAMES[d] || '').filter(Boolean).join(' · ');
    }
}

function getDueHint(habit: Task, todayKey: string): string {
    const checkIn = habit.checkIns[todayKey];
    if (checkIn === 2) return 'Completed today';
    if (checkIn === 1) return 'Partially completed';

    if (habit.habitStartedOn && habit.habitStartedOn > todayKey) {
        const tomorrow = formatDateKey(addDays(parseDateKey(todayKey), 1));
        if (habit.habitStartedOn === tomorrow) return 'Starts tomorrow';
        return `Starts ${formatShortDate(parseDateKey(habit.habitStartedOn))}`;
    }

    if (habit.dueDate) {
        if (habit.dueDate < todayKey) return 'Overdue';
        if (habit.dueDate === todayKey) return 'Today';
    }

    if (habit.repeat) {
        return getRepeatDescription(habit.repeat);
    }
    return '';
}

export function HabitRow({ habit, todayKey: propTodayKey }: HabitRowProps) {
    const router = useRouter();
    const todayKey = propTodayKey || formatDateKey(new Date());
    const [chooserOpen, setChooserOpen] = useState(false);

    const habitColor = habit.color || '#3b82f6';
    const checkInLevel = habit.checkIns[todayKey];
    const isDueOrOverdueUnfinished =
        habit.dueDate !== null && habit.dueDate <= todayKey && !checkInLevel;

    const notStarted = Boolean(habit.habitStartedOn && habit.habitStartedOn > todayKey);
    const days = rollingDays(todayKey, LIST_DAYS);
    const dueHint = getDueHint(habit, todayKey);

    const handleRowClick = () => {
        router.push(`/habits/${habit.id}`);
    };

    const handleCompleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (notStarted) return;
        setChooserOpen(true);
    };

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                onClick={handleRowClick}
                className={cn(
                    'group relative flex flex-col gap-3 p-4 pl-5 rounded-lg cursor-pointer select-none',
                    'bg-bg-primary border border-border shadow-elev-1',
                    'transition-shadow duration-200 hover:shadow-elev-2'
                )}
            >
                {/* Left stripe for due/overdue unfinished */}
                {isDueOrOverdueUnfinished && (
                    <span
                        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                        style={{ backgroundColor: habitColor }}
                    />
                )}

                {/* Top row: dot + title + due hint + complete control */}
                <div className="flex items-start gap-3">
                    <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                        style={{ backgroundColor: habitColor }}
                    />

                    <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-text-primary truncate">
                            {habit.title}
                        </div>
                        <div
                            className={cn(
                                'text-xs font-medium mt-0.5',
                                isDueOrOverdueUnfinished && habit.dueDate && habit.dueDate < todayKey
                                    ? 'text-danger font-semibold'
                                    : isDueOrOverdueUnfinished
                                      ? 'text-accent font-semibold'
                                      : 'text-text-tertiary'
                            )}
                        >
                            {dueHint}
                        </div>
                    </div>

                    {/* Complete Control (40x40 min touch target) */}
                    <button
                        type="button"
                        onClick={handleCompleteClick}
                        disabled={notStarted}
                        aria-label={notStarted ? `${habit.title} has not started` : `Log check-in for ${habit.title}`}
                        className={cn(
                            'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90',
                            notStarted && 'opacity-40'
                        )}
                        style={{
                            border: `2px solid ${habitColor}`,
                            backgroundColor:
                                checkInLevel === 2
                                    ? habitColor
                                    : checkInLevel === 1
                                      ? `color-mix(in srgb, ${habitColor} 40%, transparent)`
                                      : 'transparent',
                        }}
                    >
                        {checkInLevel === 2 && (
                            <Check className="w-5 h-5 text-white" strokeWidth={2.8} />
                        )}
                        {checkInLevel === 1 && (
                            <span
                                className="w-3.5 h-3.5 rounded-full"
                                style={{ backgroundColor: habitColor }}
                            />
                        )}
                    </button>
                </div>

                {/* Rolling contribution graph */}
                <div className="pt-1">
                    <ContributionGraph
                        color={habitColor}
                        checkIns={habit.checkIns}
                        days={days}
                        columns={LIST_COLS}
                    />
                </div>
            </motion.div>

            <IntensityChooser
                isOpen={chooserOpen}
                onClose={() => setChooserOpen(false)}
                habit={habit}
                dateKey={todayKey}
            />
        </>
    );
}
