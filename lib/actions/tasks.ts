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
import { formatDateKey } from '@/lib/utils/dates';
import { accumulateElapsed, displayedElapsedMs, setCheckIn } from '@/lib/habits/logic';
import { completeHabit } from '@/lib/actions/habits';

export type TaskStatus = 'default' | 'started' | 'paused' | 'done';

interface CreateTaskInput {
    title: string;
    goalId?: string | null;
    priority?: boolean;
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

    const habitDefaults = {
        repeat: null,
        habitStartedOn: null,
        color: null,
        sameTimeWeekly: false,
        lockedTime: null,
        checkIns: {},
        checkInElapsed: {},
        elapsedMs: 0,
        dueDate: null,
    } as const;

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
        priority: input.priority ?? false,
        ...habitDefaults,
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
            priority: input.priority ?? false,
            ...habitDefaults,
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

    // Title fans out to every calendar event linked to this task, not just the primary slot.
    const matchingEvents = updates.title
        ? useCalendarStore.getState().events.filter((e) => e.taskId === taskId)
        : [];
    matchingEvents.forEach((e) =>
        useCalendarStore.getState().updateEvent(e.id, { title: updates.title })
    );

    try {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, updates);

        if (updates.title) {
            await Promise.all(
                matchingEvents.map((e) =>
                    updateDoc(doc(db, 'calendar_events', e.id), { title: updates.title })
                )
            );
        }
    } catch (error) {
        console.error('Failed to update task:', error);
    }
}

export async function deleteTask(taskId: string) {
    const task = useTasksStore.getState().tasks.find(t => t.id === taskId);
    const linkedEvents = useCalendarStore.getState().events.filter((e) => e.taskId === taskId);
    const eventIdsToDelete = new Set(linkedEvents.map((e) => e.id));
    if (task?.calendarSlot?.eventId) {
        eventIdsToDelete.add(task.calendarSlot.eventId);
    }

    useTasksStore.getState().removeTask(taskId);
    eventIdsToDelete.forEach((id) => useCalendarStore.getState().removeEvent(id));

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
    }

    try {
        const taskRef = doc(db, 'tasks', taskId);
        await deleteDoc(taskRef);

        await Promise.all(
            Array.from(eventIdsToDelete).map((id) => deleteDoc(doc(db, 'calendar_events', id)))
        );
    } catch (error) {
        if (task) {
            useTasksStore.getState().addTask(task);
        }
        throw error;
    }
}

/** Pause a started task, accumulating elapsed time from its live timer. */
async function pauseIfStarted(taskId: string, nowMs: number): Promise<void> {
    const task = useTasksStore.getState().tasks.find((t) => t.id === taskId);
    if (!task || task.status !== 'started') return;

    const startedMs = task.startedAt?.toMillis?.();
    // Never accumulate from 0 when startedAt is missing — keep the existing elapsedMs.
    const elapsedMs = startedMs
        ? accumulateElapsed(task.elapsedMs ?? 0, startedMs, nowMs)
        : task.elapsedMs ?? 0;
    const pausedAt = Timestamp.now();

    useTasksStore.getState().updateTask(taskId, {
        status: 'paused',
        elapsedMs,
        startedAt: null,
        pausedAt,
    });
    if (task.calendarSlot?.eventId) {
        useCalendarStore.getState().updateEvent(task.calendarSlot.eventId, { status: 'scheduled' });
    }

    try {
        await updateDoc(doc(db, 'tasks', taskId), {
            status: 'paused',
            elapsedMs,
            startedAt: null,
            pausedAt,
        });
        if (task.calendarSlot?.eventId) {
            await updateDoc(doc(db, 'calendar_events', task.calendarSlot.eventId), { status: 'scheduled' });
        }
    } catch (error) {
        console.error('Failed to pause task:', error);
    }
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
    if (newStatus === 'done') {
        const current = useTasksStore.getState().tasks.find((t) => t.id === taskId);
        if (current?.repeat) {
            return completeHabit(taskId, 2);
        }
    }

    const now = Timestamp.now();
    const nowMs = Date.now();
    const today = formatDateKey(new Date());

    if (newStatus === 'started') {
        // One live timer: pause every other started task first.
        const others = useTasksStore.getState().tasks.filter((t) => t.id !== taskId && t.status === 'started');
        for (const other of others) {
            await pauseIfStarted(other.id, nowMs);
        }
    }

    const task = useTasksStore.getState().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updates: Partial<Task> = { status: newStatus };
    const firestoreUpdates: Record<string, any> = { status: newStatus };

    if (newStatus === 'started') {
        updates.startedAt = now;
        firestoreUpdates.startedAt = now;

        if (task.repeat && task.checkIns[today] === undefined) {
            updates.checkIns = setCheckIn(task.checkIns, today, 1);
            firestoreUpdates[`checkIns.${today}`] = 1;
        }

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }
    } else if (newStatus === 'paused') {
        const startedMs = task.startedAt?.toMillis?.();
        const elapsedMs = startedMs
            ? accumulateElapsed(task.elapsedMs ?? 0, startedMs, nowMs)
            : task.elapsedMs ?? 0;
        updates.elapsedMs = elapsedMs;
        updates.startedAt = null;
        updates.pausedAt = now;
        firestoreUpdates.elapsedMs = elapsedMs;
        firestoreUpdates.startedAt = null;
        firestoreUpdates.pausedAt = now;

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(30);
        }
    } else if (newStatus === 'default') {
        updates.elapsedMs = 0;
        updates.startedAt = null;
        updates.pausedAt = null;
        updates.completedAt = null;
        firestoreUpdates.elapsedMs = 0;
        firestoreUpdates.startedAt = null;
        firestoreUpdates.pausedAt = null;
        firestoreUpdates.completedAt = null;
    } else if (newStatus === 'done') {
        // One-off only — habits already returned via completeHabit above.
        const checkInElapsed = { ...task.checkInElapsed, [today]: displayedElapsedMs(task, nowMs) };
        updates.completedAt = now;
        updates.checkInElapsed = checkInElapsed;
        firestoreUpdates.completedAt = now;
        firestoreUpdates[`checkInElapsed.${today}`] = checkInElapsed[today];

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([30, 50, 30, 50, 100]);
        }
    }

    useTasksStore.getState().updateTask(taskId, updates);

    const eventStatus = newStatus === 'done' ? 'completed' :
        newStatus === 'started' ? 'active' : 'scheduled';

    if (task.calendarSlot?.eventId) {
        useCalendarStore.getState().updateEvent(task.calendarSlot.eventId, { status: eventStatus });
    }

    try {
        await updateDoc(doc(db, 'tasks', taskId), firestoreUpdates);

        if (task.calendarSlot?.eventId) {
            await updateDoc(doc(db, 'calendar_events', task.calendarSlot.eventId), { status: eventStatus });
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
