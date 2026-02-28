'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Trash2 } from 'lucide-react';
import { Note } from '@/lib/firebase/firestore';
import { updateNote, deleteNote } from '@/lib/actions/notes';
import { cn } from '@/lib/utils/cn';
import { formatTimeAgo } from '@/lib/utils/dates';

interface NoteOverlayProps {
    note: Note | null;
    isOpen: boolean;
    onClose: () => void;
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

export function NoteOverlay({ note, isOpen, onClose }: NoteOverlayProps) {
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync content when note changes
    useEffect(() => {
        if (note) {
            setContent(note.content);
        }
    }, [note]);

    // Auto-focus textarea when opened
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => {
                textareaRef.current?.focus();
                // Move cursor to end
                const len = textareaRef.current?.value.length || 0;
                textareaRef.current?.setSelectionRange(len, len);
            }, 200);
        }
    }, [isOpen]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

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

    const debouncedSave = useDebounce(saveNote, 800);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);
        if (note) {
            debouncedSave(note.id, newContent);
        }
    };

    const handlePriorityToggle = async () => {
        if (!note) return;
        await updateNote(note.id, { priority: !note.priority });
    };

    const handleDelete = async () => {
        if (!note) return;
        await deleteNote(note.id);
        onClose();
    };

    if (!note) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex flex-col">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Overlay Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={cn(
                            'relative z-10 flex flex-col',
                            'w-full h-full md:h-auto md:max-h-[80vh]',
                            'md:w-full md:max-w-xl md:mx-auto md:my-auto md:mt-[10vh]',
                            'bg-bg-primary md:rounded-2xl md:shadow-2xl md:border md:border-border/50',
                            'overflow-hidden'
                        )}
                    >
                        {/* Toolbar */}
                        <div className="flex items-center justify-between p-4 border-b border-border/50 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-bg-secondary transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                                >
                                    <X className="w-5 h-5 text-text-secondary" />
                                </button>
                                <div className="flex items-center gap-2">
                                    {isSaving ? (
                                        <span className="text-xs text-[#4ecdc4] animate-pulse font-medium">Saving...</span>
                                    ) : (
                                        <span className="text-xs text-text-secondary/60">
                                            {note.updatedAt ? formatTimeAgo(note.updatedAt.toDate()) : 'Just now'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {/* Star */}
                                <button
                                    onClick={handlePriorityToggle}
                                    className={cn(
                                        'p-2 rounded-lg transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center',
                                        note.priority
                                            ? 'text-[#4ecdc4]'
                                            : 'text-text-secondary/40 hover:text-[#4ecdc4]/70'
                                    )}
                                >
                                    <Star className={cn('w-5 h-5', note.priority && 'fill-current')} />
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={handleDelete}
                                    className="p-2 rounded-lg text-text-secondary/40 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Priority indicator */}
                        {note.priority && (
                            <div className="h-0.5 bg-gradient-to-r from-[#4ecdc4] to-[#a8dadc] flex-shrink-0" />
                        )}

                        {/* Editor */}
                        <div className="flex-1 overflow-auto p-4 md:p-6">
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={handleContentChange}
                                placeholder="What's on your mind?"
                                className={cn(
                                    'w-full h-full min-h-[60vh] md:min-h-[40vh] bg-transparent resize-none',
                                    'focus:outline-none focus:ring-0 focus:shadow-none',
                                    'text-base md:text-lg text-text-primary placeholder:text-text-secondary/40',
                                    'leading-relaxed'
                                )}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
