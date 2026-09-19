'use client';

import { db, doc, updateDoc, Task, RepeatRule, CheckInLevel } from '@/lib/firebase/firestore';
import { useTasksStore, useCalendarStore } from '@/lib/store/optimistic';
import { formatDateKey, addDays } from '@/lib/utils/dates';
import { isDueOn, nextDueDate, setCheckIn, rollHabit, parseDateKey, repeatRulesEqual } from '@/lib/habits/logic';
import { nextHabitColor } from '@/lib/habits/palette';
import { syncWeeklySeries, tearDownWeeklySeries } from '@/lib/actions/habitSeries';

export async function setTaskRepeat(
    taskId: string,
    repeat: RepeatRule | null,
    extras?: { sameTimeWeekly?: boolean; color?: string | null },
): Promise<void> {
    const task = useTasksStore.getState().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const today = formatDateKey(new Date());

    if (repeat === null) {
        const updates: Partial<Task> = {
            repeat: null,
            habitStartedOn: null,
            sameTimeWeekly: false,
            lockedTime: null,
            dueDate: null,
        };
        const keepDateKey = task.calendarSlot?.date === today ? today : null;

        useTasksStore.getState().updateTask(taskId, updates);
        try {
            await updateDoc(doc(db, 'tasks', taskId), updates as Record<string, unknown>);
        } catch (error) {
            console.error('Failed to disable habit repeat:', error);
        }
        await tearDownWeeklySeries(taskId, keepDateKey);
        return;
    }

    const habitStartedOn = task.habitStartedOn ?? today;
    const otherHexes = useTasksStore
        .getState()
        .tasks.filter((t) => t.id !== taskId && t.repeat !== null && t.color)
        .map((t) => t.color as string);
    const color = extras?.color ?? task.color ?? nextHabitColor(otherHexes);
    const ruleUnchanged = Boolean(task.repeat && task.dueDate && repeatRulesEqual(task.repeat, repeat));
    const dueDate = ruleUnchanged
        ? task.dueDate
        : isDueOn(repeat, today, habitStartedOn)
            ? today
            : nextDueDate(repeat, formatDateKey(addDays(parseDateKey(today), -1)), habitStartedOn);

    const updates: Partial<Task> = { repeat, habitStartedOn, color, dueDate };
    if (extras?.sameTimeWeekly === true) {
        updates.sameTimeWeekly = true;
    }

    useTasksStore.getState().updateTask(taskId, updates);
    try {
        await updateDoc(doc(db, 'tasks', taskId), updates as Record<string, unknown>);
    } catch (error) {
        console.error('Failed to enable habit repeat:', error);
    }
}

export async function completeHabit(taskId: string, level: CheckInLevel): Promise<void> {
    const task = useTasksStore.getState().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const today = formatDateKey(new Date());
    const roll = rollHabit({ task, todayKey: today, level, nowMs: Date.now() });

    const optimisticUpdates: Partial<Task> = {
        status: roll.status,
        startedAt: roll.startedAt,
        pausedAt: roll.pausedAt,
        completedAt: roll.completedAt,
        elapsedMs: roll.elapsedMs,
        checkIns: roll.checkIns,
        checkInElapsed: roll.checkInElapsed,
        dueDate: roll.dueDate,
    };
    if (!task.sameTimeWeekly) {
        optimisticUpdates.calendarSlot = null;
    }
    useTasksStore.getState().updateTask(taskId, optimisticUpdates);

    const todayEvent = useCalendarStore.getState().events.find((e) => e.taskId === taskId && e.date === today);
    if (todayEvent) {
        useCalendarStore.getState().updateEvent(todayEvent.id, { status: 'completed' });
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 50, 30, 50, 100]);
    }

    try {
        const firestoreUpdates: Record<string, unknown> = {
            status: roll.status,
            startedAt: roll.startedAt,
            pausedAt: roll.pausedAt,
            completedAt: roll.completedAt,
            elapsedMs: roll.elapsedMs,
            [`checkIns.${today}`]: roll.checkIns[today],
            [`checkInElapsed.${today}`]: roll.checkInElapsed[today],
            dueDate: roll.dueDate,
        };
        if (!task.sameTimeWeekly) {
            firestoreUpdates.calendarSlot = null;
        }
        await updateDoc(doc(db, 'tasks', taskId), firestoreUpdates);

        if (todayEvent) {
            await updateDoc(doc(db, 'calendar_events', todayEvent.id), { status: 'completed' });
        }

        if (task.sameTimeWeekly) {
            await syncWeeklySeries(taskId);
        }
    } catch (error) {
        console.error('Failed to complete habit:', error);
    }
}

export async function setCheckInLevel(taskId: string, dateKey: string, level: CheckInLevel): Promise<void> {
    const task = useTasksStore.getState().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const checkIns = setCheckIn(task.checkIns, dateKey, level);
    useTasksStore.getState().updateTask(taskId, { checkIns });

    try {
        await updateDoc(doc(db, 'tasks', taskId), { [`checkIns.${dateKey}`]: level });
    } catch (error) {
        console.error('Failed to set check-in level:', error);
    }
}

export async function setHabitColor(taskId: string, color: string): Promise<void> {
    useTasksStore.getState().updateTask(taskId, { color });
    const events = useCalendarStore.getState().events.filter((e) => e.taskId === taskId);
    events.forEach((e) => useCalendarStore.getState().updateEvent(e.id, { color }));

    try {
        await updateDoc(doc(db, 'tasks', taskId), { color });
        await Promise.all(events.map((e) => updateDoc(doc(db, 'calendar_events', e.id), { color })));
    } catch (error) {
        console.error('Failed to set habit color:', error);
    }
}

export async function setSameTimeWeekly(taskId: string, enabled: boolean): Promise<void> {
    const task = useTasksStore.getState().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const today = formatDateKey(new Date());

    if (enabled) {
        const lockedTime =
            task.lockedTime ??
            (task.calendarSlot
                ? { startTime: task.calendarSlot.startTime, endTime: task.calendarSlot.endTime }
                : null);

        useTasksStore.getState().updateTask(taskId, { sameTimeWeekly: true, lockedTime });
        try {
            await updateDoc(doc(db, 'tasks', taskId), { sameTimeWeekly: true, lockedTime });
        } catch (error) {
            console.error('Failed to enable same-time weekly:', error);
        }

        await syncWeeklySeries(taskId); // no-ops without lockedTime — never throws
        return;
    }

    const hasTodayEvent = useCalendarStore.getState().events.some((e) => e.taskId === taskId && e.date === today);
    useTasksStore.getState().updateTask(taskId, { sameTimeWeekly: false, lockedTime: null });

    try {
        await updateDoc(doc(db, 'tasks', taskId), { sameTimeWeekly: false, lockedTime: null });
    } catch (error) {
        console.error('Failed to disable same-time weekly:', error);
    }

    await tearDownWeeklySeries(taskId, hasTodayEvent ? today : null);
}
