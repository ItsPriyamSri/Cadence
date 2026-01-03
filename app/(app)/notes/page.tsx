'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
            <div className="p-4">
                <h1 className="text-2xl font-bold text-text-primary mb-1">Brain Dump</h1>
                <p className="text-sm text-text-secondary mb-6">
                    Capture thoughts, ideas, and mental notes
                </p>

                {/* Goals Section */}
                <GoalsTile />

                {/* Notes Section */}
                <NoteEditor />
            </div>

            {/* Goal Modal */}
            <GoalModal />
        </motion.div>
    );
}
