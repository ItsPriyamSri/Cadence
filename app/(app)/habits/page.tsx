'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Repeat } from 'lucide-react';
import { useHabits } from '@/lib/hooks/useHabits';
import { useAppStore } from '@/lib/store/app';
import { fadeIn } from '@/lib/utils/animations';
import { CadenceLoader } from '@/components/ui/CadenceLoader';

export default function HabitsPage() {
    const { habits, loading } = useHabits();
    const { openHabitForm } = useAppStore();

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
                <div className="space-y-3">
                    {/* Placeholder list until Task 2/3 */}
                    {habits.map((habit) => (
                        <div
                            key={habit.id}
                            className="p-4 rounded-lg bg-bg-primary border border-border shadow-elev-1"
                        >
                            <span className="font-semibold text-text-primary">{habit.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
