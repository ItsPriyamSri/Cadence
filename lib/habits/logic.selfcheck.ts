import assert from 'node:assert/strict';
import {
    isDueOn,
    nextDueDate,
    dueDaysInWeek,
    currentStreak,
    bestStreak,
    displayedElapsedMs,
    accumulateElapsed,
    rollHabit,
    todayRecapItems,
    weekStartKey,
} from './logic';

const daily = { kind: 'daily' as const };
const every2 = { kind: 'everyN' as const, n: 2 };
const mwf = { kind: 'weekdays' as const, days: [1, 3, 5] };

assert.equal(isDueOn(daily, '2026-09-19', '2026-09-01'), true);
assert.equal(isDueOn(every2, '2026-09-19', '2026-09-17'), true); // 2 days later
assert.equal(isDueOn(every2, '2026-09-18', '2026-09-17'), false);
assert.equal(isDueOn(mwf, '2026-09-21', '2026-09-01'), true); // Monday
assert.equal(isDueOn(mwf, '2026-09-22', '2026-09-01'), false); // Tuesday
assert.equal(nextDueDate(daily, '2026-09-19', '2026-09-01'), '2026-09-20');
assert.equal(nextDueDate(mwf, '2026-09-21', '2026-09-01'), '2026-09-23'); // Mon → Wed
assert.equal(weekStartKey('2026-09-19'), '2026-09-14'); // Sat → Mon 14th
assert.deepEqual(dueDaysInWeek(mwf, '2026-09-14', '2026-09-01'), ['2026-09-14', '2026-09-16', '2026-09-18']);

assert.equal(currentStreak(daily, '2026-09-01', { '2026-09-18': 2, '2026-09-19': 2 }, '2026-09-19'), 2);
assert.equal(currentStreak(daily, '2026-09-01', { '2026-09-18': 2, '2026-09-19': 1 }, '2026-09-19'), 1);
assert.equal(currentStreak(daily, '2026-09-01', { '2026-09-17': 2, '2026-09-19': 2 }, '2026-09-19'), 1); // 18 missing breaks
assert.equal(bestStreak(daily, '2026-09-17', { '2026-09-17': 2, '2026-09-18': 1, '2026-09-19': 2 }, '2026-09-19'), 2);

assert.equal(displayedElapsedMs({ status: 'started', elapsedMs: 60_000, startedAt: 1_000 }, 4_000), 63_000);
assert.equal(displayedElapsedMs({ status: 'paused', elapsedMs: 60_000, startedAt: null }, 99_000), 60_000);
assert.equal(accumulateElapsed(10_000, 1_000, 4_000), 13_000);

const rolled = rollHabit({
    task: {
        id: 't1', userId: 'u', title: 'Run', status: 'started',
        createdAt: null as any, startedAt: { toMillis: () => 1000 }, pausedAt: null, completedAt: null,
        goalId: null, calendarSlot: null, order: 1, priority: false,
        repeat: daily, habitStartedOn: '2026-09-01', color: '#ef4444',
        sameTimeWeekly: false, lockedTime: null, checkIns: {}, checkInElapsed: {},
        elapsedMs: 5_000, dueDate: '2026-09-19',
    } as any,
    todayKey: '2026-09-19',
    level: 2,
    nowMs: 4000,
});
assert.equal(rolled.status, 'default');
assert.equal(rolled.elapsedMs, 0);
assert.equal(rolled.checkIns['2026-09-19'], 2);
assert.equal(rolled.checkInElapsed['2026-09-19'], 8_000); // 5000 + (4000-1000)
assert.equal(rolled.dueDate, '2026-09-20');

const recap = todayRecapItems([
    { ...({} as any), id: 'h1', title: 'Run', repeat: daily, checkIns: { '2026-09-19': 2 }, checkInElapsed: { '2026-09-19': 8_000 }, status: 'default', elapsedMs: 0, startedAt: null, dueDate: '2026-09-20' },
    { ...({} as any), id: 'o1', title: 'Email', repeat: null, status: 'started', elapsedMs: 1_000, startedAt: 1000, checkIns: {}, checkInElapsed: {}, completedAt: null },
], '2026-09-19', 4000);
assert.equal(recap.some((r) => r.taskId === 'h1' && r.kind === 'habit' && r.elapsedMs === 8_000), true);
assert.equal(recap.some((r) => r.taskId === 'o1' && r.inProgress), true);

console.log('logic.selfcheck OK');
