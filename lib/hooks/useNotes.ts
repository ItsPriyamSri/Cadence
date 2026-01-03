'use client';

import { useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import { db, docToNote } from '@/lib/firebase/firestore';
import { useUser } from '@/lib/firebase/auth';
import { useNotesStore } from '@/lib/store/optimistic';

export function useNotes() {
    const { user } = useUser();
    const { notes, loading, setNotes, setLoading } = useNotesStore();

    useEffect(() => {
        if (!user) {
            setNotes([]);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, 'notes'),
            where('userId', '==', user.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const notesData = snapshot.docs.map(docToNote);
                setNotes(notesData);
            },
            (error) => {
                console.error('Error fetching notes:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, setNotes, setLoading]);

    return { notes, loading };
}
