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
import { db, Goal } from '@/lib/firebase/firestore';
import { getCurrentUserId } from '@/lib/firebase/auth';
import { useGoalsStore } from '@/lib/store/optimistic';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
} from 'date-fns';

export type GoalType = 'weekly' | 'monthly' | 'quarterly' | 'custom';

interface CreateGoalInput {
    title: string;
    type: GoalType;
    progress?: number;
    startDate?: Date;
    endDate?: Date;
}

function generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getGoalDateRange(type: GoalType): { start: Date; end: Date } {
    const now = new Date();

    switch (type) {
        case 'weekly':
            return {
                start: startOfWeek(now, { weekStartsOn: 1 }),
                end: endOfWeek(now, { weekStartsOn: 1 }),
            };
        case 'monthly':
            return {
                start: startOfMonth(now),
                end: endOfMonth(now),
            };
        case 'quarterly':
            const quarter = Math.floor(now.getMonth() / 3);
            const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
            const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
            return { start: quarterStart, end: quarterEnd };
        case 'custom':
            return { start: now, end: now };
    }
}

export async function createGoal(input: CreateGoalInput): Promise<string> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const tempId = generateTempId();
    const { start, end } = input.type === 'custom' && input.startDate && input.endDate
        ? { start: input.startDate, end: input.endDate }
        : getGoalDateRange(input.type);
    const now = Timestamp.now();

    // Optimistic update
    const optimisticGoal: Goal = {
        id: tempId,
        userId,
        title: input.title,
        type: input.type,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        createdAt: now,
        progress: input.progress ?? 0,
    };

    useGoalsStore.getState().addGoal(optimisticGoal);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 20, 60]);
    }

    // Background sync
    try {
        const goalRef = await addDoc(collection(db, 'goals'), {
            userId,
            title: input.title,
            type: input.type,
            startDate: Timestamp.fromDate(start),
            endDate: Timestamp.fromDate(end),
            createdAt: serverTimestamp(),
            progress: input.progress ?? 0,
        });

        useGoalsStore.getState().updateGoal(tempId, { id: goalRef.id } as any);
        return goalRef.id;
    } catch (error) {
        useGoalsStore.getState().removeGoal(tempId);
        throw error;
    }
}

export async function updateGoal(goalId: string, updates: Partial<Goal>) {
    // Optimistic update
    useGoalsStore.getState().updateGoal(goalId, updates);

    // Background sync
    try {
        const goalRef = doc(db, 'goals', goalId);
        await updateDoc(goalRef, updates);
    } catch (error) {
        console.error('Failed to update goal:', error);
        throw error;
    }
}

export async function deleteGoal(goalId: string) {
    const goal = useGoalsStore.getState().goals.find(g => g.id === goalId);

    // Optimistic update
    useGoalsStore.getState().removeGoal(goalId);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
    }

    // Background sync
    try {
        const goalRef = doc(db, 'goals', goalId);
        await deleteDoc(goalRef);
    } catch (error) {
        if (goal) {
            useGoalsStore.getState().addGoal(goal);
        }
        throw error;
    }
}
