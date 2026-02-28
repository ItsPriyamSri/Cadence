'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, PenLine } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { NoteOverlay } from './NoteOverlay';
import { useNotes } from '@/lib/hooks/useNotes';
import { createNote } from '@/lib/actions/notes';
import { staggerContainer, fadeIn } from '@/lib/utils/animations';
import { cn } from '@/lib/utils/cn';

export function NoteEditor() {
    const { notes, loading } = useNotes();
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Sort notes: priority first, then by updatedAt
    const sortedNotes = useMemo(() => {
        return [...notes].sort((a, b) => {
            if (a.priority && !b.priority) return -1;
            if (!a.priority && b.priority) return 1;
            const aTime = a.updatedAt?.toMillis?.() || 0;
            const bTime = b.updatedAt?.toMillis?.() || 0;
            return bTime - aTime;
        });
    }, [notes]);

    const editingNote = editingNoteId ? notes.find(n => n.id === editingNoteId) || null : null;

    const handleCreateNote = async () => {
        setIsCreating(true);
        try {
            const noteId = await createNote('');
            // Immediately open in edit overlay
            setEditingNoteId(noteId);
        } catch (error) {
            console.error('Failed to create note:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleOpenNote = (noteId: string) => {
        setEditingNoteId(noteId);
    };

    const handleCloseOverlay = () => {
        setEditingNoteId(null);
    };

    if (loading) {
        return (
            <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center justify-center py-16 gap-4"
            >
                <div className="w-12 h-12 rounded-full border-4 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin" />
                <p className="text-sm text-text-secondary">Loading notes...</p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            {/* New Note Button */}
            <button
                onClick={handleCreateNote}
                disabled={isCreating}
                className={cn(
                    'w-full p-5 rounded-2xl border-2 border-dashed transition-all duration-200',
                    'border-border hover:border-[#4ecdc4] hover:bg-[#4ecdc4]/5',
                    'flex items-center justify-center gap-3 group',
                    'active:scale-[0.99]',
                    isCreating && 'opacity-50 cursor-wait'
                )}
            >
                {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#4ecdc4]" />
                ) : (
                    <div className="p-2 rounded-xl bg-bg-secondary group-hover:bg-[#4ecdc4]/20 transition-colors">
                        <Plus className="w-5 h-5 text-text-secondary group-hover:text-[#4ecdc4] transition-colors" />
                    </div>
                )}
                <span className="text-base font-medium text-text-secondary group-hover:text-[#4ecdc4] transition-colors">
                    {isCreating ? 'Creating...' : 'Capture a Thought'}
                </span>
            </button>

            {/* Notes List */}
            {sortedNotes.length === 0 ? (
                <motion.div
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="text-center py-16"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#4ecdc4]/20 to-[#a8dadc]/20 flex items-center justify-center shadow-inner">
                        <PenLine className="w-10 h-10 text-[#4ecdc4]" />
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
                        {sortedNotes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onClick={() => handleOpenNote(note.id)}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Full-screen Note Overlay */}
            <NoteOverlay
                note={editingNote}
                isOpen={!!editingNoteId}
                onClose={handleCloseOverlay}
            />
        </div>
    );
}
