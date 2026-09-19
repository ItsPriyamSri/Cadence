# Cadence Overhaul — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Model:** Claude Sonnet 5. You own data, pure logic, and Firestore writes only. Do **not** add pages, graphs, overlays, or nav. If a UI file is the only caller you need, export the function and stop.
>
> **Prerequisite:** None. This pass runs first.
>
> **Contract:** `docs/cadence-overhaul/SRS.md` wins over this plan if they ever differ.

**Goal:** Habits are repeating tasks with check-ins, roll, elapsed time, and optional weekly calendar series — all written through the existing Firebase action style.

**Architecture:** Keep types on `Task` / `CalendarEvent`. Put date/streak/elapsed/roll/recap in a Firebase-free `lib/habits/logic.ts`. Actions call that module, then update Zustand + Firestore the same way `lib/actions/tasks.ts` already does. Many calendar events per habit only when `sameTimeWeekly` is true.

**Tech Stack:** TypeScript, Firebase JS SDK (already installed), Zustand optimistic stores, `date-fns` (already installed). No new packages. Self-check via `npx --yes tsx`.

## Global Constraints

- No new npm dependencies in `package.json`.
- No new Firestore collections or composite indexes.
- No Insights, reports collection, quantity targets, RRULE, skip, or history wipe.
- One live timer: `updateTaskStatus(..., 'started')` pauses every other started task first.
- Tasks/Calendar `done` on a habit is `completeHabit(id, 2)` — status must not remain `done`.
- Habit `checkIns` / `checkInElapsed` keys are never deleted.
- Dates are local `yyyy-MM-dd` via `formatDateKey` from `lib/utils/dates.ts`.
- Week is Monday–Sunday (`weekStartsOn: 1`).
- Weekday numbers are `Date.getDay()`: 0 Sunday … 6 Saturday.
- Match existing action style: optimistic store first, then Firestore, rollback or `console.error` as neighbors do.
- Do not add Cursor / Co-authored-by trailers to commits.
- Every task’s requirements include this section.

### File map

| File | Responsibility |
|---|---|
| `lib/firebase/firestore.ts` | Types + `docToTask` / `docToCalendarEvent` defaults |
| `lib/habits/palette.ts` | `HABIT_PALETTE`, `nextHabitColor` |
| `lib/habits/logic.ts` | Pure functions listed in SRS §3 and `todayRecapItems` |
| `lib/habits/logic.selfcheck.ts` | Runnable asserts |
| `lib/actions/habits.ts` | Repeat, complete, intensity, color, same-time toggle |
| `lib/actions/habitSeries.ts` | `syncWeeklySeries`, `tearDownWeeklySeries`, `ensureWeeklySeriesForOpenHabits` |
| `lib/actions/tasks.ts` | Create defaults, status machine, delete all events, title fan-out |
| `lib/actions/calendar.ts` | Drop / reschedule / schedule hooks that call habitSeries |

---

### Task 1: Types and palette

**Files:**
- Modify: `lib/firebase/firestore.ts`
- Create: `lib/habits/palette.ts`

**Interfaces:**
- Consumes: existing `Task`, `CalendarEvent`, `docToTask`, `docToCalendarEvent`
- Produces: types and defaults exactly as SRS §2.1–2.4; `HABIT_PALETTE`; `nextHabitColor(existingHexes: string[]): string`

- [ ] **Step 1: Add types and Task/CalendarEvent fields**

In `lib/firebase/firestore.ts`, add the types from SRS §2.1 next to `Task`. Add every new field to `Task` and `boundWeekly: boolean` to `CalendarEvent`.

In `docToTask`, apply SRS §2.4 defaults (keep the existing `priority` default). In `docToCalendarEvent`, default `boundWeekly: data.boundWeekly ?? false`.

In `lib/actions/calendar.ts`, add `boundWeekly?: boolean` to `CreateEventInput` and set `boundWeekly: input.boundWeekly ?? false` on **both** optimistic literals and **both** `addDoc` payloads (create + drop). Task 1 is not done until those writes exist.

- [ ] **Step 1b: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no new errors from the `boundWeekly` field on existing event literals.

- [ ] **Step 2: Write `lib/habits/palette.ts`**

```ts
export const HABIT_PALETTE = [
    '#ef4444',
    '#3b82f6',
    '#22c55e',
    '#a855f7',
    '#f59e0b',
    '#06b6d4',
    '#ec4899',
    '#f97316',
] as const;

export function nextHabitColor(existingHexes: string[]): string {
    const used = new Set(existingHexes.map((c) => c.toLowerCase()));
    const found = HABIT_PALETTE.find((c) => !used.has(c.toLowerCase()));
    if (found) return found;
    return HABIT_PALETTE[existingHexes.length % HABIT_PALETTE.length];
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/firebase/firestore.ts lib/habits/palette.ts
git commit -m "$(cat <<'EOF'
Add habit fields to Task and the shared color palette.

EOF
)"
```

Then `git log -1 --format='%B'` and strip any Cursor trailer with amend only if that HEAD commit is yours and unpushed.

---

### Task 2: Pure habit logic + self-check

**Files:**
- Create: `lib/habits/logic.ts`
- Create: `lib/habits/logic.selfcheck.ts`

**Interfaces:**
- Consumes: `import type { RepeatRule, CheckInLevel, Task }` from firestore (type-only — never a value import, or `tsx` boots Firebase). `formatDateKey`, `addDays`, `getWeekRange` from `lib/utils/dates.ts`
- Produces: exactly these exports (signatures frozen for the frontend plan):

```ts
parseDateKey(key: string): Date
isDueOn(rule: RepeatRule, dateKey: string, habitStartedOn: string): boolean
nextDueDate(rule: RepeatRule, fromDateKey: string, habitStartedOn: string): string
dueDaysInWeek(rule: RepeatRule, weekStartKey: string, habitStartedOn: string): string[]
setCheckIn(checkIns: Record<string, CheckInLevel>, dateKey: string, level: CheckInLevel): Record<string, CheckInLevel>
currentStreak(rule: RepeatRule, habitStartedOn: string, checkIns: Record<string, CheckInLevel>, todayKey: string): number
bestStreak(rule: RepeatRule, habitStartedOn: string, checkIns: Record<string, CheckInLevel>, todayKey: string): number
displayedElapsedMs(task: { status: Task['status']; elapsedMs: number; startedAt: { toMillis?: () => number } | number | null }, nowMs: number): number
accumulateElapsed(elapsedMs: number, startedAtMs: number, nowMs: number): number
rollHabit(input: { task: Task; todayKey: string; level: CheckInLevel; nowMs: number }): RollResult
todayRecapItems(tasks: Task[], todayKey: string, nowMs: number): RecapItem[]
weekStartKey(dateKey: string): string  // Monday of that week, yyyy-MM-dd
```

`RollResult` and recap item shape: SRS §3.4 and §4.4.

- [ ] **Step 1: Implement `lib/habits/logic.ts`**

Rules (copy, do not reinterpret):

- `isDueOn` / `nextDueDate` / `dueDaysInWeek`: SRS §3.1. `nextDueDate` is the smallest key **strictly after** `fromDateKey`. Loop day-by-day, max 366, throw `Error('nextDueDate: none found')` if exceeded.
- `everyN`: `diffDays(habitStartedOn, dateKey) >= 0 && diffDays % n === 0`.
- Streaks: SRS §3.2 (`1` does not increment and does not break; missing due day breaks; only `2` increments).
- Elapsed: SRS §3.3.
- `rollHabit`: SRS §3.4. Requires `task.repeat` and `task.habitStartedOn`; throw if missing.
- `todayRecapItems`: SRS §4.4. For `completedAt` date, if `toDate` exists use `formatDateKey(completedAt.toDate())`.
- `weekStartKey`: `formatDateKey(getWeekRange(parseDateKey(dateKey)).start)`.

Parse keys with `parseDateKey` (local `new Date(y, m - 1, d)`). Do **not** use `parseISO` on a `yyyy-MM-dd` key. Use `addDays` / `getWeekRange` from `lib/utils/dates.ts` on those local Dates. Do not import Firebase.

- [ ] **Step 2: Write `lib/habits/logic.selfcheck.ts`**

This file must actually fail if the rules are wrong. Include at least:

```ts
import assert from 'node:assert/strict';
import { isDueOn, nextDueDate, dueDaysInWeek, currentStreak, bestStreak, displayedElapsedMs, accumulateElapsed, rollHabit, todayRecapItems, weekStartKey } from './logic';

const daily = { kind: 'daily' as const };
const every2 = { kind: 'everyN' as const, n: 2 };
const mwf = { kind: 'weekdays' as const, days: [1, 3, 5] };

assert.equal(isDueOn(daily, '2026-09-19', '2026-09-01'), true);
assert.equal(isDueOn(every2, '2026-09-19', '2026-09-17'), true);  // 2 days later
assert.equal(isDueOn(every2, '2026-09-18', '2026-09-17'), false);
assert.equal(isDueOn(mwf, '2026-09-21', '2026-09-01'), true);   // Monday
assert.equal(isDueOn(mwf, '2026-09-22', '2026-09-01'), false);  // Tuesday
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
```

Fix the Monday date in `mwf` asserts if your calendar disagrees — **2026-09-21 is Monday**, 2026-09-14 is Monday. Recheck before committing. If an assert’s calendar math is wrong, fix the assert to the real weekday, not the production rule.

- [ ] **Step 3: Run the self-check and watch it fail**

```bash
npx --yes tsx lib/habits/logic.selfcheck.ts
```

Expected first time (if Step 1 is incomplete): FAIL / `ERR_MODULE_NOT_FOUND` or assertion error.

- [ ] **Step 4: Finish `logic.ts` until the self-check prints `logic.selfcheck OK` and exits 0**

```bash
npx --yes tsx lib/habits/logic.selfcheck.ts
```

Expected: `logic.selfcheck OK`

- [ ] **Step 5: Commit**

```bash
git add lib/habits/logic.ts lib/habits/logic.selfcheck.ts
git commit -m "$(cat <<'EOF'
Add habit due, streak, elapsed, and roll logic with a self-check.

EOF
)"
```

Verify `git log -1 --format='%B'` has no Cursor trailer.

---

### Task 3: Habit actions

**Files:**
- Create: `lib/actions/habits.ts`

**Interfaces:**
- Consumes: `rollHabit`, `isDueOn`, `nextDueDate`, `setCheckIn`, `nextHabitColor`; `useTasksStore`; `getCurrentUserId`; `doc`/`updateDoc`/`db`
- Produces:

```ts
setTaskRepeat(taskId: string, repeat: RepeatRule | null, extras?: { sameTimeWeekly?: boolean; color?: string | null }): Promise<void>
completeHabit(taskId: string, level: CheckInLevel): Promise<void>
setCheckInLevel(taskId: string, dateKey: string, level: CheckInLevel): Promise<void>
setHabitColor(taskId: string, color: string): Promise<void>
setSameTimeWeekly(taskId: string, enabled: boolean): Promise<void>
```

Series helpers are Task 5 and **must** live in `lib/actions/habitSeries.ts`. Import them statically from there. Do not put them in `calendar.ts` and do not dynamic-import.

- [ ] **Step 1: Implement the five functions**

Follow SRS §4.1 exactly.

`setTaskRepeat` when enabling:

- `habitStartedOn = task.habitStartedOn ?? formatDateKey(new Date())`
- `color = extras?.color ?? task.color ?? nextHabitColor(otherHabits.map(h => h.color).filter(Boolean))`
- `dueDate` = today if `isDueOn(repeat, today, habitStartedOn)` else `nextDueDate(repeat, formatDateKey(addDays(parseDateKey(today), -1)), habitStartedOn)` so the first due is `>= today`
- If `extras?.sameTimeWeekly === false` or omitted, leave `sameTimeWeekly` as-is unless turning repeat off

`setTaskRepeat` when disabling: clear `habitStartedOn`, `sameTimeWeekly`, `lockedTime`, `dueDate`; keep maps and color; tear down series.

`completeHabit`: compute `rollHabit`; optimistic `updateTask` with the roll fields **and** `calendarSlot: null` when `!sameTimeWeekly`; mark today’s event completed if any store event has `taskId` and `date === today` (leave that event in the store); Firestore: dotted `checkIns.${today}` / `checkInElapsed.${today}` plus status/due/elapsed reset — do not `updateDoc` the entire `checkIns` map. Then `syncWeeklySeries` only if `sameTimeWeekly`.

`setCheckInLevel`: `{ ...checkIns, [dateKey]: level }` only.

`setHabitColor`: task + every matching event in `useCalendarStore`.

`setSameTimeWeekly`: SRS §4.1. Enabling without `lockedTime` sets the flag and no-ops sync. Do **not** throw.

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no errors in files you touched. Do not drive-by fix unrelated pre-existing errors; if `tsc` is already dirty, at least your new files must be clean.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/habits.ts
git commit -m "$(cat <<'EOF'
Add habit write actions for repeat, complete, and intensity.

EOF
)"
```

---

### Task 4: Task status machine and deletes

**Files:**
- Modify: `lib/actions/tasks.ts`

**Interfaces:**
- Consumes: `completeHabit`, `accumulateElapsed`, `displayedElapsedMs`, `formatDateKey`
- Produces: updated `createTask`, `updateTaskStatus`, `deleteTask` per SRS §4.2

- [ ] **Step 1: `createTask` defaults**

On both the optimistic object and the Firestore payload, set:

```
repeat: null,
habitStartedOn: null,
color: null,
sameTimeWeekly: false,
lockedTime: null,
checkIns: {},
checkInElapsed: {},
elapsedMs: 0,
dueDate: null,
```

- [ ] **Step 2: Rewrite `updateTaskStatus`**

Implement the table in SRS §4.2.

**First lines of `updateTaskStatus`:** if `newStatus === 'done'`, load the task; if `task.repeat` then `return completeHabit(taskId, 2)` before any optimistic write.

Pause helper (same file, not exported unless useful):

```ts
async function pauseIfStarted(taskId: string, nowMs: number) {
    const task = useTasksStore.getState().tasks.find((t) => t.id === taskId);
    if (!task || task.status !== 'started') return;
    const startedMs = task.startedAt?.toMillis?.();
    const elapsedMs = startedMs
        ? accumulateElapsed(task.elapsedMs ?? 0, startedMs, nowMs)
        : (task.elapsedMs ?? 0);
    // optimistic + firestore: status paused, elapsedMs, startedAt null, pausedAt Timestamp.now()
}
```

On `'started'`: for each other task with `status === 'started'`, `await pauseIfStarted`. Then start this one with `startedAt: Timestamp.now()` (not `serverTimestamp()`). If `task.repeat` and `!task.checkIns[today]`, dotted write `checkIns.${today} = 1`.

On `'done'` + habit: already returned at the top.

On `'done'` + one-off: existing done fields plus `checkInElapsed: { ...task.checkInElapsed, [today]: displayedElapsedMs(task, Date.now()) }`.

On `'default'`: zero `elapsedMs`, `startedAt`, `pausedAt`, `completedAt`.

Keep existing vibration and calendar `eventStatus` updates for the primary `calendarSlot` event. Habit done goes through `completeHabit` (that function marks today’s event completed).

- [ ] **Step 3: `deleteTask` and title fan-out**

From `useCalendarStore.getState().events.filter(e => e.taskId === taskId)`, delete each (store + Firestore). Still delete `calendarSlot.eventId` if it was not in that list.

In `updateTask`, when `updates.title` is set, write that title to **every** matching event, not only `calendarSlot.eventId`.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add lib/actions/tasks.ts
git commit -m "$(cat <<'EOF'
Make task status own elapsed time, one live timer, and habit completion.

EOF
)"
```

---

### Task 5: Weekly calendar series

**Files:**
- Create: `lib/actions/habitSeries.ts`
- Modify: `lib/actions/calendar.ts`

**Interfaces:**
- Consumes: `dueDaysInWeek`, `weekStartKey`, `addHour`, existing create/update/delete event helpers
- Produces:

```ts
syncWeeklySeries(taskId: string): Promise<void>
tearDownWeeklySeries(taskId: string, keepDateKey: string | null): Promise<void>
ensureWeeklySeriesForOpenHabits(): Promise<void>
```

Plus changed behavior on `handleTaskDropOnCalendar`, `rescheduleEvent`, `setTaskSchedule`, `updateCalendarEvent` (if EventTimeEditor should stay correct — EventTimeEditor already calls `updateCalendarEvent` / resize; hook time-sync there).

- [ ] **Step 1: `syncWeeklySeries` / `tearDownWeeklySeries` / `ensureWeeklySeriesForOpenHabits`**

SRS §4.3. Implementation notes:

- Times come from `task.lockedTime`. If missing, abort.
- Reuse an existing event on that date + taskId instead of creating a duplicate.
- New events: `boundWeekly: true`, `color: task.color || '#3a86ff'`, `status: 'scheduled'` unless that date is today and the task is started (`active`) or already completed today (`completed`).
- After sync, set `calendarSlot` to the primary event (today if present, else earliest remaining day in this week `>= today`).
- `ensureWeeklySeriesForOpenHabits`: iterate `useTasksStore` habits with `sameTimeWeekly === true`, `await syncWeeklySeries` each. Swallow per-habit errors with `console.error` so one failure does not block the rest.

- [ ] **Step 2: Wire drop / reschedule / schedule / unschedule**

- `handleTaskDropOnCalendar`: after a successful link, if the task is a habit and `sameTimeWeekly`, set `lockedTime` `{ startTime, endTime }` from the drop and `await syncWeeklySeries(taskId)`.
- `rescheduleEvent`: if `event.boundWeekly || linkedTask?.sameTimeWeekly`, update `lockedTime` to the new hour span, write that start/end onto **all** of this week’s bound events for the task, **do not change their dates**. Update `calendarSlot` times if it still points at one of them.
- `setTaskSchedule`: if schedule set and habit + sameTimeWeekly → lock + sync. If schedule null → `setSameTimeWeekly` off path: `tearDownWeeklySeries(taskId, null)` and `sameTimeWeekly false`, `lockedTime null`, `calendarSlot null` (unschedule disables the toggle — SRS §4.3).
- `updateCalendarEvent`: if the event is bound / task is same-time and `startTime`/`endTime` change, treat like a series time update (all bound events this week + `lockedTime`).
- `handleEventResize`: same as time change if bound.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/actions/calendar.ts lib/actions/habitSeries.ts lib/actions/habits.ts
git commit -m "$(cat <<'EOF'
Sync same-time weekly calendar events from the habit lock.

EOF
)"
```

---

### Task 6: Backend verification

**Files:** none new unless a self-check was missing a case found below.

- [ ] **Step 1: Re-run logic self-check**

```bash
npx --yes tsx lib/habits/logic.selfcheck.ts
```

Expected: `logic.selfcheck OK`

- [ ] **Step 2: Confirm the public export surface**

Grep and confirm these symbols exist and are exported:

- `lib/habits/logic.ts`: all Task 2 produces
- `lib/habits/palette.ts`: `HABIT_PALETTE`, `nextHabitColor`
- `lib/actions/habits.ts`: five functions
- `lib/actions/habitSeries.ts`: `syncWeeklySeries`, `tearDownWeeklySeries`, `ensureWeeklySeriesForOpenHabits`
- `updateTaskStatus`, `createTask`, `deleteTask`

If any name drifted from the SRS, rename to the SRS name. Frontend is written against these strings.

- [ ] **Step 3: Commit only if you changed files**

---

## Spec coverage (self-review)

| SRS | Task |
|---|---|
| §2 types/defaults/palette | 1 |
| §3 + §4.4 + NFR-8 | 2 |
| §4.1 | 3 |
| §4.2 FR-T1–T3 FR-S2 FR-S3 | 4 |
| §4.3 FR-S4 FR-S5 | 5 |
| FR-D1–D3 (no reports, no wipe) | honored by never adding those writes |
| UI requirements | frontend plan — do not implement here |
