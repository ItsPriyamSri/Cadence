'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoalsTile } from '@/components/goals/GoalsTile';
import { GoalModal } from '@/components/goals/GoalModal';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { fadeIn } from '@/lib/utils/animations';

export default function NotesPage() {
    return (
        <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto"
        >
            <div className="p-4 sm:p-6 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-2">Brain Dump</h1>
                    <p className="text-text-secondary">
                        Capture thoughts, ideas, and keep track of your goals
                    </p>
                </div>

                {/* Goals Section */}
                <section>
                    <GoalsTile />
                </section>

                {/* Notes Section with visual separation */}
                <section className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent/50 to-transparent rounded-full opacity-20" />
                    <div className="pl-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            Recent Notes
                        </h2>
                        <NoteEditor />
                    </div>
                </section>
            </div>

            {/* Goal Modal */}
            <GoalModal />
        </motion.div>
    );
}
