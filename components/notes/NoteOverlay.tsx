'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, Trash2 } from 'lucide-react';
import { Note } from '@/lib/firebase/firestore';
import { updateNote, deleteNote } from '@/lib/actions/notes';
import { useNoteDraft } from './useNoteDraft';
import { cn } from '@/lib/utils/cn';

interface NoteOverlayProps {
    note: Note | null;
    isOpen: boolean;
    onClose: () => void;
}

export function NoteOverlay({ note, isOpen, onClose }: NoteOverlayProps) {
    const { content, saving, error, onContent } = useNoteDraft(note);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && note && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-50 flex flex-col bg-bg-primary"
                >
                    <div
                        className="shrink-0 flex items-center gap-2 px-3.5 pb-3 border-b border-border"
                        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
                    >
                        <button onClick={onClose} className="flex items-center gap-1 py-2 pr-2 text-accent text-base font-semibold">
                            <ChevronLeft className="w-[22px] h-[22px]" strokeWidth={2.2} /> Notes
                        </button>
                        <span className={cn('flex items-center gap-1.5 text-xs font-semibold', error ? 'text-danger' : 'text-text-tertiary')}>
                            <span className={cn('w-2 h-2 rounded-full', error ? 'bg-danger' : saving ? 'bg-accent animate-pulse' : 'bg-done')} />
                            {error ? 'Save failed' : saving ? 'Saving…' : 'Saved'}
                        </span>
                        <div className="flex-1" />
                        <button
                            onClick={() => updateNote(note.id, { priority: !note.priority })}
                            aria-label="Toggle priority"
                            className={cn('w-10 h-10 flex items-center justify-center rounded-xl', note.priority ? 'text-priority' : 'text-text-tertiary')}
                        >
                            <Star className="w-5 h-5" fill={note.priority ? 'currentColor' : 'none'} strokeWidth={1.8} />
                        </button>
                        <button
                            onClick={() => { deleteNote(note.id); onClose(); }}
                            aria-label="Delete note"
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-text-tertiary hover:text-danger"
                        >
                            <Trash2 className="w-[19px] h-[19px]" />
                        </button>
                    </div>
                    <textarea
                        autoFocus
                        value={content}
                        onChange={(e) => onContent(e.target.value)}
                        placeholder="Start writing…"
                        className="flex-1 border-none bg-transparent px-[18px] pt-[18px] text-base leading-relaxed text-text-primary outline-none resize-none"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
