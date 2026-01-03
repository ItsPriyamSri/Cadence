'use client';

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db, Note } from '@/lib/firebase/firestore';
import { getCurrentUserId } from '@/lib/firebase/auth';
import { useNotesStore } from '@/lib/store/optimistic';

function generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function createNote(content: string = ''): Promise<string> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const tempId = generateTempId();
    const now = Timestamp.now();

    const optimisticNote: Note = {
        id: tempId,
        userId,
        content,
        createdAt: now,
        updatedAt: now,
    };

    useNotesStore.getState().addNote(optimisticNote);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
    }

    try {
        const noteRef = await addDoc(collection(db, 'notes'), {
            userId,
            content,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        useNotesStore.getState().updateNote(tempId, { id: noteRef.id } as any);
        return noteRef.id;
    } catch (error) {
        useNotesStore.getState().removeNote(tempId);
        throw error;
    }
}

export async function updateNote(noteId: string, updates: Partial<Note>) {
    useNotesStore.getState().updateNote(noteId, {
        ...updates,
        updatedAt: Timestamp.now(),
    });

    try {
        const noteRef = doc(db, 'notes', noteId);
        await updateDoc(noteRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Failed to update note:', error);
    }
}

export async function deleteNote(noteId: string) {
    const note = useNotesStore.getState().notes.find(n => n.id === noteId);

    useNotesStore.getState().removeNote(noteId);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
    }

    try {
        const noteRef = doc(db, 'notes', noteId);
        await deleteDoc(noteRef);
    } catch (error) {
        if (note) {
            useNotesStore.getState().addNote(note);
        }
        throw error;
    }
}
