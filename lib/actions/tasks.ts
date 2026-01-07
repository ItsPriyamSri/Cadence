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
import { db, Task } from '@/lib/firebase/firestore';
import { getCurrentUserId } from '@/lib/firebase/auth';
import { useTasksStore, useCalendarStore } from '@/lib/store/optimistic';

export type TaskStatus = 'default' | 'started' | 'paused' | 'done';

interface CreateTaskInput {
    title: string;
    goalId?: string | null;
}

function generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function createTask(input: CreateTaskInput): Promise<string> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const tempId = generateTempId();
    const now = Timestamp.now();
    const order = Date.now();

    const optimisticTask: Task = {
        id: tempId,
        userId,
        title: input.title,
        status: 'default',
        createdAt: now,
        startedAt: null,
        pausedAt: null,
        completedAt: null,
        goalId: input.goalId || null,
        calendarSlot: null,
        order,
        priority: false,
    };

    useTasksStore.getState().addTask(optimisticTask);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
    }

    try {
        const taskRef = await addDoc(collection(db, 'tasks'), {
            userId,
            title: input.title,
            status: 'default',
            createdAt: serverTimestamp(),
            startedAt: null,
            pausedAt: null,
            completedAt: null,
            goalId: input.goalId || null,
            calendarSlot: null,
            order,
            priority: false,
        });

        useTasksStore.getState().updateTask(tempId, { id: taskRef.id } as any);
        return taskRef.id;
    } catch (error) {
        useTasksStore.getState().removeTask(tempId);
        throw error;
    }
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
    // Optimistic update for task
    useTasksStore.getState().updateTask(taskId, updates);

    // Get the task to check if it has a linked calendar event
    const task = useTasksStore.getState().tasks.find(t => t.id === taskId);

    // If title is being updated and task has calendar event, sync the title
    if (updates.title && task?.calendarSlot?.eventId) {
        useCalendarStore.getState().updateEvent(task.calendarSlot.eventId, {
            title: updates.title,
        });
    }

    try {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, updates);

        // Sync title to calendar event in Firestore
        if (updates.title && task?.calendarSlot?.eventId) {
            const eventRef = doc(db, 'calendar_events', task.calendarSlot.eventId);
            await updateDoc(eventRef, { title: updates.title });
        }
    } catch (error) {
        console.error('Failed to update task:', error);
    }
}

export async function deleteTask(taskId: string) {
    const task = useTasksStore.getState().tasks.find(t => t.id === taskId);

    useTasksStore.getState().removeTask(taskId);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
    }

    try {
        const taskRef = doc(db, 'tasks', taskId);
        await deleteDoc(taskRef);

        // Also delete linked calendar event
        if (task?.calendarSlot?.eventId) {
            const eventRef = doc(db, 'calendar_events', task.calendarSlot.eventId);
            await deleteDoc(eventRef);
            useCalendarStore.getState().removeEvent(task.calendarSlot.eventId);
        }
    } catch (error) {
        if (task) {
            useTasksStore.getState().addTask(task);
        }
        throw error;
    }
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    const now = Timestamp.now();
    const updates: Partial<Task> = { status: newStatus };

    if (newStatus === 'started') {
        updates.startedAt = now;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }
    } else if (newStatus === 'paused') {
        updates.pausedAt = now;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(30);
        }
    } else if (newStatus === 'done') {
        updates.completedAt = now;
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([30, 50, 30, 50, 100]);
        }
    }

    useTasksStore.getState().updateTask(taskId, updates);

    const task = useTasksStore.getState().tasks.find(t => t.id === taskId);

    // Calculate calendar event status
    const eventStatus = newStatus === 'done' ? 'completed' :
        newStatus === 'started' ? 'active' : 'scheduled';

    // Update optimistic store
    if (task?.calendarSlot?.eventId) {
        useCalendarStore.getState().updateEvent(task.calendarSlot.eventId, {
            status: eventStatus,
        });
    }

    try {
        const taskRef = doc(db, 'tasks', taskId);
        const firestoreUpdates: Record<string, any> = { status: newStatus };

        if (newStatus === 'started') {
            firestoreUpdates.startedAt = serverTimestamp();
        } else if (newStatus === 'paused') {
            firestoreUpdates.pausedAt = serverTimestamp();
        } else if (newStatus === 'done') {
            firestoreUpdates.completedAt = serverTimestamp();
        }

        await updateDoc(taskRef, firestoreUpdates);

        // Sync calendar event status to Firestore for ALL status changes
        if (task?.calendarSlot?.eventId) {
            const eventRef = doc(db, 'calendar_events', task.calendarSlot.eventId);
            await updateDoc(eventRef, { status: eventStatus });
        }
    } catch (error) {
        console.error('Failed to update task status:', error);
    }
}

export function getNextStatus(currentStatus: TaskStatus): TaskStatus | null {
    switch (currentStatus) {
        case 'default':
            return 'started';
        case 'started':
            return 'paused';
        case 'paused':
            return 'started';
        case 'done':
            return null;
    }
}
