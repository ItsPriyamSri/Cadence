'use client';

import { useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import { db, docToGoal } from '@/lib/firebase/firestore';
import { useUser } from '@/lib/firebase/auth';
import { useGoalsStore, useTasksStore } from '@/lib/store/optimistic';

export function useGoals() {
    const { user } = useUser();
    const { goals, loading, setGoals, setLoading } = useGoalsStore();

    useEffect(() => {
        if (!user) {
            setGoals([]);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, 'goals'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const goalsData = snapshot.docs.map(docToGoal);
                setGoals(goalsData);
            },
            (error) => {
                console.error('Error fetching goals:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, setGoals, setLoading]);

    return { goals, loading };
}

export function useActiveGoals() {
    const { goals, loading } = useGoalsStore();

    const now = new Date();
    const activeGoals = goals.filter((goal) => {
        const endDate = goal.endDate?.toDate?.() || new Date(goal.endDate as any);
        return endDate >= now;
    });

    return { goals: activeGoals, loading };
}

export function useGoalProgress(goalId: string) {
    const { tasks } = useTasksStore();

    // Calculate from optimistic store for instant updates
    const goalTasks = tasks.filter(t => t.goalId === goalId);

    if (goalTasks.length === 0) return 0;

    const completed = goalTasks.filter(t => t.status === 'done').length;
    return Math.round((completed / goalTasks.length) * 100);
}
