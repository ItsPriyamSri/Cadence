'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Trash2 } from 'lucide-react';
import { Note } from '@/lib/firebase/firestore';
import { updateNote, deleteNote } from '@/lib/actions/notes';
import { cn } from '@/lib/utils/cn';
import { formatTimeAgo } from '@/lib/utils/dates';
import { listItem } from '@/lib/utils/animations';

interface NoteCardProps {
    note: Note;
    onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
    const handlePriorityToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateNote(note.id, { priority: !note.priority });
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteNote(note.id);
    };

    // Get preview text (first 120 chars, no newlines)
    const preview = note.content
        ? note.content.replace(/\n/g, ' ').slice(0, 120) + (note.content.length > 120 ? '...' : '')
        : 'Empty note';

    return (
        <motion.div
            layout
            layoutId={note.id}
            variants={listItem}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClick}
            className={cn(
                'group relative p-4 rounded-2xl cursor-pointer',
                'bg-bg-secondary/30 hover:bg-bg-secondary/50',
                'border border-border/50 hover:border-border',
                'transition-all duration-200',
                'active:scale-[0.98]',
                note.priority && 'ring-1 ring-[#4ecdc4]/40 bg-[#4ecdc4]/5'
            )}
        >
            {/* Priority indicator - top bar */}
            {note.priority && (
                <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#4ecdc4] to-[#a8dadc] rounded-b-full" />
            )}

            {/* Preview text - read only */}
            <p className={cn(
                'text-sm text-text-primary leading-relaxed line-clamp-3',
                !note.content && 'text-text-secondary/50 italic'
            )}>
                {preview}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-text-secondary/60">
                    {note.updatedAt ? formatTimeAgo(note.updatedAt.toDate()) : 'Just now'}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePriorityToggle}
                        className={cn(
                            'p-2 rounded-lg transition-all duration-200 min-w-[36px] min-h-[36px] flex items-center justify-center',
                            note.priority
                                ? 'text-[#4ecdc4]'
                                : 'text-text-secondary/30 hover:text-[#4ecdc4]/70 opacity-0 group-hover:opacity-100'
                        )}
                    >
                        <Star className={cn('w-4 h-4', note.priority && 'fill-current')} />
                    </button>

                    <button
                        onClick={handleDelete}
                        className="p-2 rounded-lg text-text-secondary/30 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
