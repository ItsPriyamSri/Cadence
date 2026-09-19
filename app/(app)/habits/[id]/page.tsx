'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useHabits } from '@/lib/hooks/useHabits';
import { fadeIn } from '@/lib/utils/animations';
import { CadenceLoader } from '@/components/ui/CadenceLoader';

export default function HabitDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const { habits, loading } = useHabits();

    const habit = habits.find((h) => h.id === id);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <CadenceLoader label="Loading habit" />
            </div>
        );
    }

    if (!habit) {
        return (
            <div className="max-w-[820px] mx-auto px-4 pt-6 text-center">
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

    return (
        <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="max-w-[820px] mx-auto px-4 pt-3 md:px-8 md:pt-0 pb-[calc(env(safe-area-inset-bottom,0px)+120px)] md:pb-10"
        >
            <div className="flex items-center gap-2 mb-4">
                <Link
                    href="/habits"
                    className="inline-flex items-center gap-1 text-accent text-sm font-semibold hover:underline"
                >
                    <ChevronLeft className="w-4 h-4" /> Habits
                </Link>
            </div>

            <h1 className="text-2xl font-bold text-text-primary">{habit.title}</h1>
        </motion.div>
    );
}
