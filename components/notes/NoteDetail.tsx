'use client';

import React from 'react';
import { Star, Trash2, PenLine } from 'lucide-react';
import { Note } from '@/lib/firebase/firestore';
import { updateNote, deleteNote } from '@/lib/actions/notes';
import { useNoteDraft } from './useNoteDraft';
import { cn } from '@/lib/utils/cn';

interface NoteDetailProps {
    note: Note | null;
    onDeleted: () => void;
}

export function NoteDetail({ note, onDeleted }: NoteDetailProps) {
    const { title, body, saving, error, onTitle, onBody } = useNoteDraft(note);

    if (!note) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-center p-6 text-text-tertiary">
                <div className="w-[60px] h-[60px] rounded-lg bg-bg-secondary flex items-center justify-center">
                    <PenLine className="w-7 h-7" strokeWidth={1.8} />
                </div>
                <p className="text-sm">Select a note to read or edit,<br />or capture a new thought.</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-2.5 px-[18px] py-4 border-b border-border">
                <span className={cn('flex items-center gap-1.5 text-xs font-semibold', error ? 'text-danger' : 'text-text-tertiary')}>
                    <span className={cn('w-2 h-2 rounded-full', error ? 'bg-danger' : saving ? 'bg-accent animate-pulse' : 'bg-done')} />
                    {error ? 'Save failed — retrying on next edit' : saving ? 'Saving…' : 'Saved'}
                </span>
                <div className="flex-1" />
                <button
                    onClick={() => updateNote(note.id, { priority: !note.priority })}
                    aria-label="Toggle priority"
                    className={cn('w-[38px] h-[38px] flex items-center justify-center rounded-xl hover:bg-bg-secondary transition-colors', note.priority ? 'text-priority' : 'text-text-tertiary')}
                >
                    <Star className="w-[19px] h-[19px]" fill={note.priority ? 'currentColor' : 'none'} strokeWidth={1.8} />
                </button>
                <button
                    onClick={() => { deleteNote(note.id); onDeleted(); }}
                    aria-label="Delete note"
                    className="w-[38px] h-[38px] flex items-center justify-center rounded-xl text-text-tertiary hover:bg-danger-bg hover:text-danger transition-colors"
                >
                    <Trash2 className="w-[18px] h-[18px]" />
                </button>
            </div>
            <input
                value={title}
                onChange={(e) => onTitle(e.target.value)}
                placeholder="Note title"
                className="border-none bg-transparent px-5 pt-[18px] pb-1.5 text-[22px] font-bold tracking-tight text-text-primary outline-none"
            />
            <textarea
                value={body}
                onChange={(e) => onBody(e.target.value)}
                placeholder="Start writing…"
                className="flex-1 border-none bg-transparent px-5 pb-5 pt-1.5 text-base leading-relaxed text-text-primary outline-none resize-none"
            />
        </>
    );
}
