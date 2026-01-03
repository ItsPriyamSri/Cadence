'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Sparkles, PenLine } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { useNotes } from '@/lib/hooks/useNotes';
import { createNote } from '@/lib/actions/notes';
import { staggerContainer, fadeIn } from '@/lib/utils/animations';
import { cn } from '@/lib/utils/cn';

export function NoteEditor() {
    const { notes, loading } = useNotes();
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateNote = async () => {
        setIsCreating(true);
        try {
            const noteId = await createNote('');
            setActiveNoteId(noteId);
        } catch (error) {
            console.error('Failed to create note:', error);
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center justify-center py-16 gap-4"
            >
                <div className="w-12 h-12 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
                <p className="text-sm text-text-secondary">Loading notes...</p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            {/* New Note Button - Enhanced */}
            <motion.button
                onClick={handleCreateNote}
                disabled={isCreating}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                    'w-full p-5 rounded-2xl border-2 border-dashed transition-all duration-300',
                    'border-border hover:border-accent hover:bg-accent/5',
                    'flex items-center justify-center gap-3 group',
                    isCreating && 'opacity-50 cursor-wait'
                )}
            >
                {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                ) : (
                    <div className="p-2 rounded-xl bg-bg-secondary group-hover:bg-accent/20 transition-colors">
                        <Plus className="w-5 h-5 text-text-secondary group-hover:text-accent transition-colors" />
                    </div>
                )}
                <span className="text-base font-medium text-text-secondary group-hover:text-accent transition-colors">
                    {isCreating ? 'Creating...' : 'Capture a Thought'}
                </span>
            </motion.button>

            {/* Notes List */}
            {notes.length === 0 ? (
                <motion.div
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="text-center py-16"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-accent/20 to-[#8338ec]/20 flex items-center justify-center shadow-inner">
                        <PenLine className="w-10 h-10 text-accent" />
                    </div>
                    <p className="text-xl font-semibold text-text-primary mb-2">No notes yet</p>
                    <p className="text-text-secondary">Capture your thoughts and ideas</p>
                </motion.div>
            ) : (
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                >
                    <AnimatePresence mode="popLayout">
                        {notes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                isActive={activeNoteId === note.id}
                                onClick={() => setActiveNoteId(note.id)}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
