'use client';

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
} from 'firebase/firestore';
import { db, CalendarEvent } from '@/lib/firebase/firestore';
import { getCurrentUserId } from '@/lib/firebase/auth';
import { useCalendarStore, useTasksStore } from '@/lib/store/optimistic';

interface CreateEventInput {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    taskId?: string | null;
    color?: string;
}

function generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function createCalendarEvent(input: CreateEventInput): Promise<string> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const tempId = generateTempId();

    const optimisticEvent: CalendarEvent = {
        id: tempId,
        userId,
        taskId: input.taskId || null,
        title: input.title,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        status: 'scheduled',
        color: input.color || '#3a86ff',
    };

    useCalendarStore.getState().addEvent(optimisticEvent);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
    }

    try {
        const eventRef = await addDoc(collection(db, 'calendar_events'), {
            userId,
            taskId: input.taskId || null,
            title: input.title,
            date: input.date,
            startTime: input.startTime,
            endTime: input.endTime,
            status: 'scheduled',
            color: input.color || '#3a86ff',
        });

        useCalendarStore.getState().updateEvent(tempId, { id: eventRef.id } as any);
        return eventRef.id;
    } catch (error) {
        useCalendarStore.getState().removeEvent(tempId);
        throw error;
    }
}

export async function updateCalendarEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
) {
    useCalendarStore.getState().updateEvent(eventId, updates);

    try {
        const eventRef = doc(db, 'calendar_events', eventId);
        await updateDoc(eventRef, updates);
    } catch (error) {
        console.error('Failed to update event:', error);
    }
}

export async function deleteCalendarEvent(eventId: string) {
    const event = useCalendarStore.getState().events.find(e => e.id === eventId);

    useCalendarStore.getState().removeEvent(eventId);

    try {
        const eventRef = doc(db, 'calendar_events', eventId);
        await deleteDoc(eventRef);
    } catch (error) {
        if (event) {
            useCalendarStore.getState().addEvent(event);
        }
        throw error;
    }
}

export async function handleTaskDropOnCalendar(
    taskId: string,
    taskTitle: string,
    dateStr: string,  // Already formatted as yyyy-MM-dd
    hour: number
) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const tempEventId = generateTempId();
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;

    // Get task status for event status
    const task = useTasksStore.getState().tasks.find(t => t.id === taskId);
    const eventStatus = task?.status === 'started' ? 'active' :
        task?.status === 'paused' ? 'scheduled' :
            task?.status === 'done' ? 'completed' : 'scheduled';

    // Optimistic update - add calendar event
    const optimisticEvent: CalendarEvent = {
        id: tempEventId,
        userId,
        taskId,
        title: taskTitle,
        date: dateStr,
        startTime,
        endTime,
        status: eventStatus,
        color: '#3a86ff',
    };

    useCalendarStore.getState().addEvent(optimisticEvent);

    // Optimistic update - update task with calendar slot
    useTasksStore.getState().updateTask(taskId, {
        calendarSlot: {
            date: dateStr,
            startTime,
            endTime,
            eventId: tempEventId,
        },
    });

    // Haptic feedback for successful drop
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
    }

    // Background sync
    try {
        const eventRef = await addDoc(collection(db, 'calendar_events'), {
            userId,
            taskId,
            title: taskTitle,
            date: dateStr,
            startTime,
            endTime,
            status: eventStatus,
            color: '#3a86ff',
        });

        // Update with real event ID
        useCalendarStore.getState().updateEvent(tempEventId, { id: eventRef.id } as any);

        // Update task in Firestore
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
            calendarSlot: {
                date: dateStr,
                startTime,
                endTime,
                eventId: eventRef.id,
            },
        });

        // Update optimistic task with real event ID
        useTasksStore.getState().updateTask(taskId, {
            calendarSlot: {
                date: dateStr,
                startTime,
                endTime,
                eventId: eventRef.id,
            },
        });
    } catch (error) {
        // Rollback
        useCalendarStore.getState().removeEvent(tempEventId);
        useTasksStore.getState().updateTask(taskId, { calendarSlot: null });
        throw error;
    }
}

export async function handleEventResize(eventId: string, newEndTime: string) {
    useCalendarStore.getState().updateEvent(eventId, { endTime: newEndTime });

    try {
        const eventRef = doc(db, 'calendar_events', eventId);
        await updateDoc(eventRef, { endTime: newEndTime });
    } catch (error) {
        console.error('Failed to resize event:', error);
    }
}

export async function unscheduleTask(taskId: string, eventId: string) {
    // Optimistic updates
    useTasksStore.getState().updateTask(taskId, { calendarSlot: null });
    useCalendarStore.getState().removeEvent(eventId);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
    }

    // Background sync
    try {
        // Remove calendar slot from task
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, { calendarSlot: null });

        // Delete the calendar event
        const eventRef = doc(db, 'calendar_events', eventId);
        await deleteDoc(eventRef);
    } catch (error) {
        console.error('Failed to unschedule task:', error);
        throw error;
    }
}

export async function rescheduleEvent(eventId: string, newDate: string, newHour: number, taskId: string | null) {
    const startTime = `${newHour.toString().padStart(2, '0')}:00`;
    const endTime = `${(newHour + 1).toString().padStart(2, '0')}:00`;

    // Optimistic update for calendar event
    useCalendarStore.getState().updateEvent(eventId, {
        date: newDate,
        startTime,
        endTime,
    });

    // Optimistic update for linked task
    if (taskId) {
        useTasksStore.getState().updateTask(taskId, {
            calendarSlot: {
                date: newDate,
                startTime,
                endTime,
                eventId,
            },
        });
    }

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 20, 30]);
    }

    // Background sync
    try {
        const eventRef = doc(db, 'calendar_events', eventId);
        await updateDoc(eventRef, {
            date: newDate,
            startTime,
            endTime,
        });

        // Update linked task's calendar slot
        if (taskId) {
            const taskRef = doc(db, 'tasks', taskId);
            await updateDoc(taskRef, {
                calendarSlot: {
                    date: newDate,
                    startTime,
                    endTime,
                    eventId,
                },
            });
        }
    } catch (error) {
        console.error('Failed to reschedule event:', error);
        throw error;
    }
}
