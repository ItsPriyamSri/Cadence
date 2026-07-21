'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Note } from '@/lib/firebase/firestore';
import { updateNote } from '@/lib/actions/notes';
import { splitNote, joinNote } from '@/lib/utils/notes';

export function useNoteDraft(note: Note | null) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Holds the not-yet-persisted write so we can flush it (not drop it) when the
    // open note changes or the editor unmounts within the debounce window.
    const pendingRef = useRef<{ id: string; title: string; body: string } | null>(null);
    const noteId = note?.id ?? null;

    const flush = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        const p = pendingRef.current;
        if (p) {
            pendingRef.current = null;
            updateNote(p.id, { content: joinNote(p.title, p.body) }).then((ok) => setError(!ok));
            setSaving(false);
        }
    }, []);

    // When the open note changes, flush the previous note's pending write first,
    // then load the new note's draft. Cleanup also flushes on unmount.
    useEffect(() => {
        setError(false);
        if (note) {
            const { title: t, body: b } = splitNote(note.content);
            setTitle(t);
            setBody(b);
        } else {
            setTitle('');
            setBody('');
        }
        return () => { flush(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noteId]);

    const scheduleSave = useCallback((id: string, nextTitle: string, nextBody: string) => {
        pendingRef.current = { id, title: nextTitle, body: nextBody };
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setSaving(true);
        setError(false);
        timeoutRef.current = setTimeout(async () => {
            const p = pendingRef.current;
            timeoutRef.current = null;
            pendingRef.current = null;
            if (!p) return;
            const ok = await updateNote(p.id, { content: joinNote(p.title, p.body) });
            setSaving(false);
            setError(!ok);
        }, 700);
    }, []);

    const onTitle = useCallback((value: string) => {
        setTitle(value);
        if (noteId) scheduleSave(noteId, value, body);
    }, [noteId, body, scheduleSave]);

    const onBody = useCallback((value: string) => {
        setBody(value);
        if (noteId) scheduleSave(noteId, title, value);
    }, [noteId, title, scheduleSave]);

    return { title, body, saving, error, onTitle, onBody };
}
