'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
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
                'group relative p-4 rounded-2xl cursor-pointer transition-all',
                'bg-bg-secondary/30 hover:bg-bg-secondary/50',
                'border border-border hover:border-border',
                isActive && 'border-accent/30 bg-accent/5'
            )}
        >
            <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="What's on your mind?"
                className={cn(
                    'w-full bg-transparent resize-none focus:outline-none',
                    'text-base text-text-primary placeholder:text-text-secondary/50',
                    'min-h-[60px] leading-relaxed'
                )}
                rows={2}
            />

            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">
                        {note.updatedAt ? formatTimeAgo(note.updatedAt.toDate()) : 'Just now'}
                    </span>
                    {isSaving && (
                        <span className="text-xs text-accent">Saving...</span>
                    )}
                </div>

                <motion.button
                    onClick={handleDelete}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1.5 rounded-lg text-text-secondary/40 hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Trash2 className="w-4 h-4" />
                </motion.button>
            </div>
        </motion.div>
    );
}
