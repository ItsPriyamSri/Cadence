'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { Button } from '@/components/ui/Button';
import { useNotes } from '@/lib/hooks/useNotes';
import { createNote } from '@/lib/actions/notes';
import { staggerContainer } from '@/lib/utils/animations';

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
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <Button
                    onClick={handleCreateNote}
                    variant="outline"
                    className="w-full justify-center border-dashed"
                    icon={<Plus className="w-4 h-4" />}
                    loading={isCreating}
                >
                    New Note
                </Button>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-auto">
                {notes.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-text-secondary">No notes yet. Create one to capture your thoughts!</p>
                    </div>
                ) : (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
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
        </div>
    );
}
