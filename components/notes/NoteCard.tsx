'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Star } from 'lucide-react';
import { Note } from '@/lib/firebase/firestore';
import { updateNote, deleteNote } from '@/lib/actions/notes';
import { cn } from '@/lib/utils/cn';
import { formatTimeAgo } from '@/lib/utils/dates';
import { listItem } from '@/lib/utils/animations';

interface NoteCardProps {
    note: Note;
    isActive: boolean;
    onClick: () => void;
}

function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedFn = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => callback(...args), delay);
        },
        [callback, delay]
    );

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return debouncedFn;
}

export function NoteCard({ note, isActive, onClick }: NoteCardProps) {
    const [content, setContent] = useState(note.content);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setContent(note.content);
    }, [note.content]);

    const saveNote = useCallback(async (noteId: string, newContent: string) => {
        setIsSaving(true);
        try {
            await updateNote(noteId, { content: newContent });
        } catch (error) {
            console.error('Failed to save note:', error);
        } finally {
            setIsSaving(false);
        }
    }, []);

    const debouncedSave = useDebounce(saveNote, 1000);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);
        debouncedSave(note.id, newContent);
    };

    const handlePriorityToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateNote(note.id, { priority: !note.priority });
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteNote(note.id);
    };

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
                'transition-colors duration-200',
                isActive && 'border-accent/30 bg-accent/5',
                note.priority && 'ring-1 ring-[#4ecdc4]/40 bg-[#4ecdc4]/5'
            )}
        >
            {/* Priority indicator - top bar */}
            {note.priority && (
                <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-[#4ecdc4] to-[#a8dadc] rounded-b-full" />
            )}

            {/* Content area */}
            <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="What's on your mind?"
                className={cn(
                    'w-full bg-transparent resize-none',
                    'focus:outline-none focus:ring-0 focus:shadow-none',
                    'text-base text-text-primary placeholder:text-text-secondary/50',
                    'min-h-[50px] leading-relaxed'
                )}
                rows={2}
            />

            {/* Footer with timestamp and actions */}
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary/70">
                        {note.updatedAt ? formatTimeAgo(note.updatedAt.toDate()) : 'Just now'}
                    </span>
                    {isSaving && (
                        <span className="text-xs text-accent animate-pulse">Saving...</span>
                    )}
                </div>

                {/* Actions on right side */}
                <div className="flex items-center gap-1">
                    {/* Star button */}
                    <button
                        onClick={handlePriorityToggle}
                        className={cn(
                            'p-2 rounded-lg transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center',
                            note.priority
                                ? 'text-[#4ecdc4]'
                                : 'text-text-secondary/30 hover:text-[#4ecdc4]/70 opacity-0 group-hover:opacity-100'
                        )}
                    >
                        <Star
                            className={cn(
                                'w-4 h-4',
                                note.priority && 'fill-current'
                            )}
                        />
                    </button>

                    {/* Delete button */}
                    <button
                        onClick={handleDelete}
                        className="p-2 rounded-lg text-text-secondary/30 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
