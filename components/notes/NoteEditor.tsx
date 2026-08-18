'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, PenLine, Undo2 } from 'lucide-react';
import { CadenceLoader } from '@/components/ui/CadenceLoader';
import { NoteCard } from './NoteCard';
import { NoteDetail } from './NoteDetail';
import { NoteOverlay } from './NoteOverlay';
import { GoalsTile } from '@/components/goals/GoalsTile';
import { useNotes } from '@/lib/hooks/useNotes';
import { createNote, deleteNote } from '@/lib/actions/notes';
import { useAppStore } from '@/lib/store/app';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

export function NoteEditor() {
    const { notes, loading } = useNotes();
    const { noteComposeNonce } = useAppStore();
    const isRail = useMediaQuery('(min-width: 768px)');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const lastNonce = useRef(noteComposeNonce);
    const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef<string | null>(null);

    const sortedNotes = useMemo(() => {
        return [...notes]
            .filter((n) => n.id !== pendingDeleteId)
            .sort((a, b) => {
                if (a.priority && !b.priority) return -1;
                if (!a.priority && b.priority) return 1;
                return (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0);
            });
    }, [notes, pendingDeleteId]);

    const selectedNote = selectedId ? notes.find((n) => n.id === selectedId) || null : null;

    const setPending = (id: string | null) => { pendingRef.current = id; setPendingDeleteId(id); };

    // Commit any pending delete immediately (e.g. before starting a new one or on unmount).
    const flushDelete = () => {
        if (deleteTimer.current) { clearTimeout(deleteTimer.current); deleteTimer.current = null; }
        const id = pendingRef.current;
        if (id) deleteNote(id).catch((e) => console.error('Failed to delete note:', e));
        setPending(null);
    };

    const requestDelete = (id: string) => {
        flushDelete();
        if (selectedId === id) setSelectedId(null);
        setPending(id);
        deleteTimer.current = setTimeout(() => {
            deleteNote(id).catch((e) => console.error('Failed to delete note:', e));
            deleteTimer.current = null;
            setPending(null);
        }, 5000);
    };

    const undoDelete = () => {
        if (deleteTimer.current) { clearTimeout(deleteTimer.current); deleteTimer.current = null; }
        setPending(null);
    };

    // On unmount, commit the pending delete so the user's intent isn't silently dropped.
    useEffect(() => () => {
        if (deleteTimer.current) {
            clearTimeout(deleteTimer.current);
            if (pendingRef.current) deleteNote(pendingRef.current).catch(() => {});
        }
    }, []);

    const handleCapture = async () => {
        try {
            const id = await createNote('');
            setSelectedId(id);
        } catch (error) {
            console.error('Failed to create note:', error);
        }
    };

    // Shell FAB / topbar "Capture a Thought" signal
    useEffect(() => {
        if (noteComposeNonce === lastNonce.current) return;
        lastNonce.current = noteComposeNonce;
        void handleCapture();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noteComposeNonce]);

    if (loading) {
        return (
            <CadenceLoader label="Loading notes" className="py-16" />
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-5 md:h-full">
            {/* LIST COLUMN */}
            <div className="w-full md:w-[360px] md:shrink-0 flex flex-col min-w-0 md:min-h-0">
                <GoalsTile />

                <div className="flex items-center gap-2.5 mt-5 mb-3 mx-1">
                    <span className="text-xs font-bold tracking-[0.06em] uppercase text-text-tertiary">Recent Notes</span>
                    <div className="flex-1" />
                    <button
                        onClick={handleCapture}
                        className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-subtle text-accent text-sm font-semibold"
                    >
                        <Plus className="w-[15px] h-[15px]" strokeWidth={2.4} /> Capture
                    </button>
                </div>

                {sortedNotes.length === 0 ? (
                    <div className="flex flex-col items-center text-center gap-2 py-12 px-6">
                        <div className="w-[72px] h-[72px] rounded-4xl bg-accent-subtle flex items-center justify-center mb-1">
                            <PenLine className="w-8 h-8 text-accent" strokeWidth={1.8} />
                        </div>
                        <h2 className="text-lg font-bold text-text-primary">No notes yet</h2>
                        <p className="text-base text-text-secondary max-w-[260px]">Capture your thoughts and ideas before they slip away.</p>
                        <button
                            onClick={handleCapture}
                            className="mt-2.5 flex items-center gap-2 px-5 py-3 rounded-md bg-accent text-on-accent text-base font-semibold shadow-[0_6px_18px_var(--accent-glow)] hover:brightness-105 transition"
                        >
                            <Plus className="w-[18px] h-[18px]" strokeWidth={2.4} /> Capture a thought
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5 md:flex-1 md:min-h-0 md:overflow-y-auto">
                        <AnimatePresence mode="popLayout">
                            {sortedNotes.map((note) => (
                                <NoteCard
                                    key={note.id}
                                    note={note}
                                    selected={isRail && note.id === selectedId}
                                    onOpen={() => setSelectedId(note.id)}
                                    onRequestDelete={() => requestDelete(note.id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* DETAIL COLUMN (rail only) */}
            {isRail && (
                <div className="flex-1 min-w-0 flex flex-col rounded-lg border border-border bg-bg-primary shadow-elev-1 overflow-hidden">
                    <NoteDetail note={selectedNote} onDeleted={() => setSelectedId(null)} />
                </div>
            )}

            {/* MOBILE OVERLAY */}
            {!isRail && (
                <NoteOverlay note={selectedNote} isOpen={!!selectedNote} onClose={() => setSelectedId(null)} />
            )}

            {/* Undo-delete toast */}
            <AnimatePresence>
                {pendingDeleteId && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.25 }}
                        className="fixed left-3 right-3 md:left-auto md:right-8 md:w-[320px] z-50 flex items-center gap-3 p-3.5 rounded-lg glass shadow-elev-3"
                        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
                    >
                        <span className="flex-1 text-sm font-semibold text-text-primary">Note deleted</span>
                        <button
                            onClick={undoDelete}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-accent text-on-accent text-sm font-semibold active:scale-95 transition-transform"
                        >
                            <Undo2 className="w-4 h-4" /> Undo
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
