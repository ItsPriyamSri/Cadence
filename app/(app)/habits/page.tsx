'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Repeat } from 'lucide-react';
import { useHabits } from '@/lib/hooks/useHabits';
import { useAppStore } from '@/lib/store/app';
import { fadeIn } from '@/lib/utils/animations';
import { CadenceLoader } from '@/components/ui/CadenceLoader';
import { HabitRow } from '@/components/habits/HabitRow';
import { HabitForm } from '@/components/habits/HabitForm';
import { Modal } from '@/components/ui/Modal';
import { formatDateKey } from '@/lib/utils/dates';

export default function HabitsPage() {
    const { habits, loading } = useHabits();
    const { isHabitFormOpen, editingHabitId, openHabitForm, closeHabitForm } = useAppStore();

    const todayKey = formatDateKey(new Date());

    const sortedHabits = useMemo(() => {
        return [...habits].sort((a, b) => {
            const aDueUnfinished =
                a.dueDate !== null && a.dueDate <= todayKey && !a.checkIns[todayKey];
            const bDueUnfinished =
                b.dueDate !== null && b.dueDate <= todayKey && !b.checkIns[todayKey];

            if (aDueUnfinished && !bDueUnfinished) return -1;
            if (!aDueUnfinished && bDueUnfinished) return 1;

            return a.title.localeCompare(b.title);
        });
    }, [habits, todayKey]);

    const editingHabit = editingHabitId
        ? habits.find((h) => h.id === editingHabitId) || null
        : null;

    return (
        <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="max-w-[820px] mx-auto px-4 pt-3 md:px-8 md:pt-0 pb-[calc(env(safe-area-inset-bottom,0px)+120px)] md:pb-10"
        >
            <h1 className="md:hidden mb-3.5 mt-1 mx-1 text-xl font-bold tracking-tight text-text-primary">
                Habits
            </h1>

            {loading ? (
                <CadenceLoader label="Loading habits" className="py-20" />
            ) : habits.length === 0 ? (
                <div className="flex flex-col items-center text-center gap-2 py-14 px-6">
                    <div className="w-[76px] h-[76px] rounded-4xl bg-accent-subtle flex items-center justify-center mb-1.5">
                        <Repeat className="w-9 h-9 text-accent" strokeWidth={1.8} />
                    </div>
                    <h2 className="text-lg font-bold text-text-primary">No habits yet</h2>
                    <p className="text-base text-text-secondary max-w-[280px]">
                        Show up every day. The graph remembers your momentum.
                    </p>
                    <button
                        onClick={() => openHabitForm()}
                        className="mt-2.5 flex items-center gap-2 px-5 py-3 rounded-md bg-accent text-on-accent text-base font-semibold shadow-[0_6px_18px_var(--accent-glow)] hover:brightness-105 transition"
                    >
                        <Plus className="w-[18px] h-[18px]" strokeWidth={2.4} /> Create your first habit
                    </button>
                </div>
            ) : (
                <motion.div layout className="space-y-3">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {sortedHabits.map((habit) => (
                            <HabitRow key={habit.id} habit={habit} todayKey={todayKey} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            <Modal
                isOpen={isHabitFormOpen}
                onClose={closeHabitForm}
                title={editingHabitId ? 'Edit Habit' : 'New Habit'}
            >
                <HabitForm initialHabit={editingHabit} onClose={closeHabitForm} />
            </Modal>
        </motion.div>
    );
}
