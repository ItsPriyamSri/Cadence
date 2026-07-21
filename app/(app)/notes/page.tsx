'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { GoalModal } from '@/components/goals/GoalModal';
import { fadeIn } from '@/lib/utils/animations';

export default function NotesPage() {
    return (
        <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="h-full flex flex-col max-w-5xl mx-auto px-4 pt-3 md:px-8 md:pt-0"
        >
            <div className="md:hidden mb-4 mx-1">
                <h1 className="text-xl font-bold tracking-tight text-text-primary">Brain Dump</h1>
                <p className="mt-1 text-sm text-text-secondary">Capture thoughts and track goals.</p>
            </div>

            <div className="flex-1 min-h-0 pb-[calc(env(safe-area-inset-bottom,0px)+120px)] md:pb-6">
                <NoteEditor />
            </div>

            <GoalModal />
        </motion.div>
    );
}
