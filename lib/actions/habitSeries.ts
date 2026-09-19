'use client';

import { db, doc, updateDoc } from '@/lib/firebase/firestore';
import type { CalendarEvent } from '@/lib/firebase/firestore';
import { useTasksStore, useCalendarStore } from '@/lib/store/optimistic';
import { addDays, formatDateKey } from '@/lib/utils/dates';
import { dueDaysInWeek, parseDateKey, weekStartKey } from '@/lib/habits/logic';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/actions/calendar';

/**
 * Project this week's due days onto the calendar at the habit's locked time.
 * No-op unless the task is a habit with sameTimeWeekly and a lockedTime set.
 */
export async function syncWeeklySeries(taskId: string): Promise<void> {
    const task = useTasksStore.getState().tasks.find((t) => t.id === taskId);
    if (!task || !task.sameTimeWeekly || !task.repeat || !task.lockedTime || !task.habitStartedOn) return;

    const lockedTime = task.lockedTime;
    const today = formatDateKey(new Date());
    const monday = weekStartKey(today);
    const sunday = formatDateKey(addDays(parseDateKey(monday), 6));
    const days = dueDaysInWeek(task.repeat, monday, task.habitStartedOn);
    const daySet = new Set(days);

    const boundThisWeek = useCalendarStore
        .getState()
        .events.filter((e) => e.taskId === taskId && e.boundWeekly && e.date >= monday && e.date <= sunday);

    for (const dateKey of days) {
        const existing = useCalendarStore.getState().events.find((e) => e.taskId === taskId && e.date === dateKey);
        if (existing) {
            const patch: Partial<CalendarEvent> = {};
            if (!existing.boundWeekly) patch.boundWeekly = true;
            if (existing.startTime !== lockedTime.startTime) patch.startTime = lockedTime.startTime;
            if (existing.endTime !== lockedTime.endTime) patch.endTime = lockedTime.endTime;
            if (existing.title !== task.title) patch.title = task.title;
            if (task.color && existing.color !== task.color) patch.color = task.color;
            if (Object.keys(patch).length > 0) {
                await updateCalendarEvent(existing.id, patch);
            }
            continue;
        }

        const eventId = await createCalendarEvent({
            title: task.title,
            date: dateKey,
            startTime: lockedTime.startTime,
            endTime: lockedTime.endTime,
            taskId,
            color: task.color || '#3a86ff',
            boundWeekly: true,
        });
        const status: CalendarEvent['status'] =
            dateKey === today && task.status === 'started'
                ? 'active'
                : dateKey === today && task.checkIns[today] !== undefined
                    ? 'completed'
                    : 'scheduled';
        if (status !== 'scheduled') {
            await updateCalendarEvent(eventId, { status });
        }
    }

    // Bound events that are no longer due this week get removed (never a completed today event).
    for (const event of boundThisWeek) {
        if (daySet.has(event.date)) continue;
        if (event.date === today && event.status === 'completed') continue;
        await deleteCalendarEvent(event.id);
    }

    // Primary slot: today's event if due/completed today, else the next due day this week, else null.
    const freshEvents = useCalendarStore.getState().events.filter((e) => e.taskId === taskId && e.boundWeekly);
    const todayEvent = freshEvents.find((e) => e.date === today);
    let primary = todayEvent && (daySet.has(today) || todayEvent.status === 'completed') ? todayEvent : undefined;
    if (!primary) {
        const nextDay = days.find((d) => d > today);
        primary = nextDay ? freshEvents.find((e) => e.date === nextDay) : undefined;
    }

    const calendarSlot = primary
        ? { date: primary.date, startTime: primary.startTime, endTime: primary.endTime, eventId: primary.id }
        : null;

    useTasksStore.getState().updateTask(taskId, { calendarSlot });
    try {
        await updateDoc(doc(db, 'tasks', taskId), { calendarSlot });
    } catch (error) {
        console.error('Failed to update habit calendar slot:', error);
    }
}

/** Delete every bound weekly event for this task except keepDateKey (if given). */
export async function tearDownWeeklySeries(taskId: string, keepDateKey: string | null): Promise<void> {
    const events = useCalendarStore.getState().events.filter((e) => e.taskId === taskId && e.boundWeekly);
    for (const event of events) {
        if (keepDateKey && event.date === keepDateKey) {
            await updateCalendarEvent(event.id, { boundWeekly: false });
            continue;
        }
        await deleteCalendarEvent(event.id);
    }
}

/** Called once tasks + calendar stores have hydrated to backfill this week's series. */
export async function ensureWeeklySeriesForOpenHabits(): Promise<void> {
    const habits = useTasksStore.getState().tasks.filter((t) => t.repeat !== null && t.sameTimeWeekly);
    for (const habit of habits) {
        try {
            await syncWeeklySeries(habit.id);
        } catch (error) {
            console.error(`Failed to sync weekly series for habit ${habit.id}:`, error);
        }
    }
}
