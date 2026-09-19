'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Pencil, Flame, Trophy } from 'lucide-react';
import { useHabits } from '@/lib/hooks/useHabits';
import { useAppStore } from '@/lib/store/app';
import { fadeIn } from '@/lib/utils/animations';
import { CadenceLoader } from '@/components/ui/CadenceLoader';
import { ContributionGraph } from '@/components/habits/ContributionGraph';
import { HabitMonthCalendar } from '@/components/habits/HabitMonthCalendar';
import { HabitForm } from '@/components/habits/HabitForm';
import { Modal } from '@/components/ui/Modal';
import { currentStreak, bestStreak, parseDateKey } from '@/lib/habits/logic';
import { formatDateKey, subDays, addDays } from '@/lib/utils/dates';

export default function HabitDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const { habits, loading } = useHabits();
    const { isHabitFormOpen, openHabitForm, closeHabitForm } = useAppStore();

    const habit = habits.find((h) => h.id === id);
    const todayKey = formatDateKey(new Date());

    const { curStreak, maxStreak, historyDays } = useMemo(() => {
        if (!habit || !habit.repeat) {
            return { curStreak: 0, maxStreak: 0, historyDays: [] };
        }

        const startedOn = habit.habitStartedOn || todayKey;
        const cur = currentStreak(habit.repeat, startedOn, habit.checkIns, todayKey);
        const max = bestStreak(habit.repeat, startedOn, habit.checkIns, todayKey);

        // Calculate days from habitStartedOn through todayKey
        const start = parseDateKey(startedOn);
        const today = parseDateKey(todayKey);

        const days: string[] = [];
        let cursor = start;
        while (cursor <= today) {
            days.push(formatDateKey(cursor));
            cursor = addDays(cursor, 1);
        }

        // If span is shorter than 35 days, pad leading days to maintain 35-day density
        if (days.length < 35) {
            const padNeeded = 35 - days.length;
            const paddedDays: string[] = [];
            for (let i = padNeeded; i >= 1; i--) {
                paddedDays.push(formatDateKey(subDays(start, i)));
            }
            return {
                curStreak: cur,
                maxStreak: max,
                historyDays: [...paddedDays, ...days],
            };
        }

        return {
            curStreak: cur,
            maxStreak: max,
            historyDays: days,
        };
    }, [habit, todayKey]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <CadenceLoader label="Loading habit" />
            </div>
        );
    }

    if (!habit) {
        return (
            <div className="max-w-[820px] mx-auto px-4 pt-10 text-center">
                <p className="text-base text-text-secondary mb-4">Habit not found</p>
                <Link
                    href="/habits"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-accent text-on-accent text-sm font-semibold"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Habits
                </Link>
            </div>
        );
    }

    const habitColor = habit.color || '#3b82f6';

    return (
        <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="max-w-[820px] mx-auto px-4 pt-3 md:px-8 md:pt-0 pb-[calc(env(safe-area-inset-bottom,0px)+120px)] md:pb-10 space-y-6"
        >
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Link
                    href="/habits"
                    className="inline-flex items-center gap-1 py-1.5 pr-3 text-accent text-sm font-semibold hover:underline"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Habits
                </Link>

                <button
                    onClick={() => openHabitForm(habit.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-bg-secondary text-text-primary text-sm font-semibold hover:bg-bg-tertiary transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
            </div>

            {/* Title & Color Badge */}
            <div className="flex items-center gap-3">
                <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: habitColor }}
                />
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
                    {habit.title}
                </h1>
            </div>

            {/* Streak metrics */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-bg-primary border border-border shadow-elev-1 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                        <Flame className="w-4 h-4 text-started" /> Current Streak
                    </div>
                    <div className="text-3xl font-bold tracking-tight text-text-primary">
                        {curStreak} <span className="text-sm font-normal text-text-secondary">days</span>
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-bg-primary border border-border shadow-elev-1 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                        <Trophy className="w-4 h-4 text-priority" /> Best Streak
                    </div>
                    <div className="text-3xl font-bold tracking-tight text-text-primary">
                        {maxStreak} <span className="text-sm font-normal text-text-secondary">days</span>
                    </div>
                </div>
            </div>

            {/* History Contribution Graph */}
            <div className="p-5 rounded-lg bg-bg-primary border border-border shadow-elev-1 space-y-3">
                <div className="text-sm font-bold text-text-primary">Activity History</div>
                <div className="overflow-x-auto scrollbar-hide pt-1">
                    <ContributionGraph
                        color={habitColor}
                        checkIns={habit.checkIns}
                        days={historyDays}
                        cell={12}
                    />
                </div>
            </div>

            {/* Month Calendar */}
            <HabitMonthCalendar habit={habit} />

            {/* Edit Modal */}
            <Modal
                isOpen={isHabitFormOpen}
                onClose={closeHabitForm}
                title="Edit Habit"
            >
                <HabitForm initialHabit={habit} onClose={closeHabitForm} />
            </Modal>
        </motion.div>
    );
}
