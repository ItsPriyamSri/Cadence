'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Note } from '@/lib/firebase/firestore';
import { cn } from '@/lib/utils/cn';
import { noteTitle, notePreview } from '@/lib/utils/notes';

interface NoteCardProps {
    note: Note;
    onClick: () => void;
    selected?: boolean;
}

export function NoteCard({ note, onClick, selected }: NoteCardProps) {
    return (
        <motion.button
            layout
            layoutId={note.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            onClick={onClick}
            className={cn(
                'group flex flex-col gap-1.5 w-full p-4 rounded-lg text-left transition-shadow',
                'bg-bg-primary border shadow-elev-1 hover:shadow-elev-2',
                selected ? 'border-accent' : 'border-border'
            )}
        >
            <div className="flex items-start gap-2">
                <span className="flex-1 text-base font-semibold leading-snug text-text-primary line-clamp-1">
                    {noteTitle(note)}
                </span>
                {note.priority && <Star className="w-4 h-4 text-priority shrink-0 mt-0.5" fill="currentColor" strokeWidth={1.6} />}
            </div>
            <p className="text-sm leading-normal text-text-secondary line-clamp-2">
                {notePreview(note)}
            </p>
        </motion.button>
    );
}
