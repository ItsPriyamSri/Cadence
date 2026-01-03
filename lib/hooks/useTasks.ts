'use client';

import { useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import { db, docToTask } from '@/lib/firebase/firestore';
import { useUser } from '@/lib/firebase/auth';
import { useTasksStore } from '@/lib/store/optimistic';

// Hook that syncs Firestore with the optimistic store
export function useTasks() {
    const { user } = useUser();
    const { tasks, loading, setTasks, setLoading } = useTasksStore();

    useEffect(() => {
        if (!user) {
            setTasks([]);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            orderBy('order', 'asc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const tasksData = snapshot.docs.map(docToTask);
                setTasks(tasksData);
            },
            (error) => {
                console.error('Error fetching tasks:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, setTasks, setLoading]);

    return { tasks, loading };
}

export function useTasksByGoal(goalId: string | null) {
    const { tasks } = useTasksStore();

    // Filter from the optimistic store instead of separate query
    const filteredTasks = goalId
        ? tasks.filter(t => t.goalId === goalId)
        : [];

    return { tasks: filteredTasks, loading: false };
}

export function useActiveTasks() {
    const { tasks } = useTasksStore();

    // Filter active tasks from the optimistic store
    const activeTasks = tasks.filter(t => t.status === 'started');

    return { activeTasks };
}
