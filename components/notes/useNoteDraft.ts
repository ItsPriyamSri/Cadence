'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Note } from '@/lib/firebase/firestore';
import { updateNote } from '@/lib/actions/notes';

export function useNoteDraft(note: Note | null) {
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Holds the not-yet-persisted write so we can flush it (not drop it) when the
    // open note changes or the editor unmounts within the debounce window.
    const pendingRef = useRef<{ id: string; content: string } | null>(null);
    const noteId = note?.id ?? null;

    const flush = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        const p = pendingRef.current;
        if (p) {
            pendingRef.current = null;
            updateNote(p.id, { content: p.content }).then((ok) => setError(!ok));
            setSaving(false);
        }
    }, []);

    // When the open note changes, flush the previous note's pending write first,
    // then load the new note's draft. Cleanup also flushes on unmount.
    useEffect(() => {
        setError(false);
        setContent(note?.content ?? '');
        return () => { flush(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noteId]);

    const onContent = useCallback((value: string) => {
        setContent(value);
        if (!noteId) return;
        pendingRef.current = { id: noteId, content: value };
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setSaving(true);
        setError(false);
        timeoutRef.current = setTimeout(async () => {
            const p = pendingRef.current;
            timeoutRef.current = null;
            pendingRef.current = null;
            if (!p) return;
            const ok = await updateNote(p.id, { content: p.content });
            setSaving(false);
            setError(!ok);
        }, 700);
    }, [noteId]);

    return { content, saving, error, onContent };
}
