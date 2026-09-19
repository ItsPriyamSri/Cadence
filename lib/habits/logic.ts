// Pure, Firebase-free habit logic. Import type only from firestore so this
// module (and its self-check) never boots the Firebase SDK.
import type { RepeatRule, CheckInLevel, Task } from '@/lib/firebase/firestore';
import { formatDateKey, addDays, getWeekRange } from '@/lib/utils/dates';

/** Parse a local `yyyy-MM-dd` key as a local calendar date (never UTC). */
export function parseDateKey(key: string): Date {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function diffDays(fromKey: string, toKey: string): number {
    const from = parseDateKey(fromKey).getTime();
    const to = parseDateKey(toKey).getTime();
    return Math.round((to - from) / 86_400_000);
}

// --- 3.1 Due dates ---------------------------------------------------------

export function isDueOn(rule: RepeatRule, dateKey: string, habitStartedOn: string): boolean {
    if (dateKey < habitStartedOn) return false;
    switch (rule.kind) {
        case 'daily':
            return true;
        case 'everyN': {
            const diff = diffDays(habitStartedOn, dateKey);
            return diff >= 0 && diff % rule.n === 0;
        }
        case 'weekdays':
            return rule.days.includes(parseDateKey(dateKey).getDay());
    }
}

export function nextDueDate(rule: RepeatRule, fromDateKey: string, habitStartedOn: string): string {
    let cursor = fromDateKey;
    for (let i = 0; i < 366; i++) {
        cursor = formatDateKey(addDays(parseDateKey(cursor), 1));
        if (isDueOn(rule, cursor, habitStartedOn)) return cursor;
    }
    throw new Error('nextDueDate: none found');
}

export function dueDaysInWeek(rule: RepeatRule, weekStartKeyStr: string, habitStartedOn: string): string[] {
    const start = parseDateKey(weekStartKeyStr);
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
        const key = formatDateKey(addDays(start, i));
        if (isDueOn(rule, key, habitStartedOn)) days.push(key);
    }
    return days;
}

export function weekStartKey(dateKey: string): string {
    return formatDateKey(getWeekRange(parseDateKey(dateKey)).start);
}

// --- 3.2 Check-ins and streaks ---------------------------------------------

export function setCheckIn(
    checkIns: Record<string, CheckInLevel>,
    dateKey: string,
    level: CheckInLevel,
): Record<string, CheckInLevel> {
    return { ...checkIns, [dateKey]: level };
}

/** Last due day <= dateKey, or null if none exists on/after habitStartedOn. */
function lastDueOnOrBefore(rule: RepeatRule, dateKey: string, habitStartedOn: string): string | null {
    if (dateKey < habitStartedOn) return null;
    let cursor = dateKey;
    for (let i = 0; i < 400; i++) {
        if (isDueOn(rule, cursor, habitStartedOn)) return cursor;
        if (cursor <= habitStartedOn) return null;
        cursor = formatDateKey(addDays(parseDateKey(cursor), -1));
    }
    return null;
}

export function currentStreak(
    rule: RepeatRule,
    habitStartedOn: string,
    checkIns: Record<string, CheckInLevel>,
    todayKey: string,
): number {
    let cursor = lastDueOnOrBefore(rule, todayKey, habitStartedOn);
    if (cursor === null) return 0;

    let streak = 0;
    for (let i = 0; i < 10_000; i++) {
        const level = checkIns[cursor];
        if (level === undefined) break; // missing due day breaks the streak
        if (level === 2) streak++;
        // level 1: continue without incrementing or breaking
        if (cursor <= habitStartedOn) break;
        const prev = lastDueOnOrBefore(rule, formatDateKey(addDays(parseDateKey(cursor), -1)), habitStartedOn);
        if (prev === null) break;
        cursor = prev;
    }
    return streak;
}

export function bestStreak(
    rule: RepeatRule,
    habitStartedOn: string,
    checkIns: Record<string, CheckInLevel>,
    todayKey: string,
): number {
    let best = 0;
    let current = 0;
    let cursor = habitStartedOn;
    for (let i = 0; i < 100_000 && cursor <= todayKey; i++) {
        if (isDueOn(rule, cursor, habitStartedOn)) {
            const level = checkIns[cursor];
            if (level === undefined) {
                current = 0;
            } else {
                if (level === 2) current++;
                if (current > best) best = current;
            }
        }
        if (cursor === todayKey) break;
        cursor = formatDateKey(addDays(parseDateKey(cursor), 1));
    }
    return best;
}

// --- 3.3 Elapsed -------------------------------------------------------------

function toMillis(startedAt: { toMillis?: () => number } | number | null): number {
    if (startedAt && typeof startedAt === 'object' && typeof startedAt.toMillis === 'function') {
        return startedAt.toMillis();
    }
    return Number(startedAt);
}

export function displayedElapsedMs(
    task: {
        status: Task['status'];
        elapsedMs: number;
        startedAt: { toMillis?: () => number } | number | null;
    },
    nowMs: number,
): number {
    if (task.status === 'started' && task.startedAt != null) {
        return task.elapsedMs + Math.max(0, nowMs - toMillis(task.startedAt));
    }
    return task.elapsedMs;
}

export function accumulateElapsed(elapsedMs: number, startedAtMs: number, nowMs: number): number {
    return elapsedMs + Math.max(0, nowMs - startedAtMs);
}

// --- 3.4 Roll -----------------------------------------------------------------

export interface RollResult {
    status: 'default';
    startedAt: null;
    pausedAt: null;
    completedAt: null;
    elapsedMs: 0;
    checkIns: Record<string, CheckInLevel>;
    checkInElapsed: Record<string, number>;
    dueDate: string;
    calendarSlot: Task['calendarSlot']; // caller may replace after series sync
}

export function rollHabit(input: {
    task: Task;
    todayKey: string;
    level: CheckInLevel;
    nowMs: number;
}): RollResult {
    const { task, todayKey, level, nowMs } = input;
    if (!task.repeat || !task.habitStartedOn) {
        throw new Error('rollHabit: task is not a habit');
    }

    const checkIns = setCheckIn(task.checkIns, todayKey, level);
    const snapped = displayedElapsedMs(task, nowMs);
    const checkInElapsed = { ...task.checkInElapsed, [todayKey]: snapped };
    const dueDate = nextDueDate(task.repeat, todayKey, task.habitStartedOn);

    return {
        status: 'default',
        startedAt: null,
        pausedAt: null,
        completedAt: null,
        elapsedMs: 0,
        checkIns,
        checkInElapsed,
        dueDate,
        calendarSlot: task.calendarSlot,
    };
}

// --- 4.4 Today recap (derived, no writes) ------------------------------------

export interface RecapItem {
    taskId: string;
    title: string;
    kind: 'habit' | 'oneoff';
    level: CheckInLevel | null; // habits only
    elapsedMs: number;
    inProgress: boolean;
}

function completedAtDateKey(completedAt: Task['completedAt']): string | null {
    if (completedAt && typeof completedAt.toDate === 'function') {
        return formatDateKey(completedAt.toDate());
    }
    return null;
}

export function todayRecapItems(tasks: Task[], todayKey: string, nowMs: number): RecapItem[] {
    const items: RecapItem[] = [];

    for (const task of tasks) {
        const inProgress = task.status === 'started' || task.status === 'paused';

        if (task.repeat !== null) {
            const hasCheckIn = task.checkIns[todayKey] !== undefined;
            const dueOrOverdue = task.dueDate !== null && task.dueDate <= todayKey;
            if (!hasCheckIn && !(inProgress && dueOrOverdue)) continue;

            items.push({
                taskId: task.id,
                title: task.title,
                kind: 'habit',
                level: task.checkIns[todayKey] ?? null,
                elapsedMs: inProgress ? displayedElapsedMs(task, nowMs) : task.checkInElapsed[todayKey] ?? 0,
                inProgress,
            });
        } else {
            const doneToday = task.status === 'done' && completedAtDateKey(task.completedAt) === todayKey;
            if (!doneToday && !inProgress) continue;

            items.push({
                taskId: task.id,
                title: task.title,
                kind: 'oneoff',
                level: null,
                elapsedMs: inProgress
                    ? displayedElapsedMs(task, nowMs)
                    : task.checkInElapsed[todayKey] ?? (doneToday ? task.elapsedMs : 0),
                inProgress,
            });
        }
    }

    items.sort((a, b) => {
        if (a.inProgress !== b.inProgress) return a.inProgress ? -1 : 1;
        return b.elapsedMs - a.elapsedMs;
    });
    return items;
}
