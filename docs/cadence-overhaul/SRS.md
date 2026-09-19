# Cadence Overhaul — Software Requirements Specification

**Product:** Cadence  
**Document:** SRS  
**Version:** 1.0  
**Date:** 2026-09-19  
**Status:** Locked for implementation (pending review + go signal)

This document is the contract. Both implementation plans must match these names, types, and rules. If a plan disagrees with this file, this file wins.

Related: `docs/cadence-overhaul/PRD.md`

---

## 1. Current system (do not reinvent)

Next.js 15 App Router, React 19, Tailwind, Framer Motion, Zustand optimistic stores, Firebase Auth + Firestore, PWA.

Existing collections: `tasks`, `calendar_events`, `notes`, `goals`, `users`.

Existing task status machine: `default` → `started` → `paused` ↔ `started`. `done` is terminal for **one-off** tasks. Habits leave `done` immediately via roll (they never sit as `done`).

Existing 1:1 link: `Task.calendarSlot.eventId` ↔ one `calendar_events` doc. This overhaul allows **many events per habit** when `sameTimeWeekly` is true. `calendarSlot` then means the **primary** event: today’s due/completed block if it exists, otherwise the next due occurrence.

No test runner is installed. Backend logic is verified with an assert self-check. Frontend is verified in the browser.

---

## 2. Data model

### 2.1 New / changed types (`lib/firebase/firestore.ts`)

```ts
export type RepeatRule =
    | { kind: 'daily' }
    | { kind: 'everyN'; n: number }       // n >= 2
    | { kind: 'weekdays'; days: number[] }; // Date.getDay(): 0 Sun … 6 Sat, unique, length >= 1

export type CheckInLevel = 1 | 2; // 1 light, 2 dark

export interface LockedTime {
    startTime: string; // 'HH:mm'
    endTime: string;   // 'HH:mm'
}
```

Add to `Task` (all new fields required on the TypeScript type; old Firestore docs get defaults in `docToTask`):

| Field | Type | Default (legacy docs) | Meaning |
|---|---|---|---|
| `repeat` | `RepeatRule \| null` | `null` | `null` = one-off |
| `habitStartedOn` | `string \| null` | `null` | `yyyy-MM-dd` when repeat was first turned on |
| `color` | `string \| null` | `null` | hex from `HABIT_PALETTE` |
| `sameTimeWeekly` | `boolean` | `false` | project this week’s due days |
| `lockedTime` | `LockedTime \| null` | `null` | clock used by the series |
| `checkIns` | `Record<string, CheckInLevel>` | `{}` | date → intensity; never auto-wiped; user undo may drop today’s key |
| `checkInElapsed` | `Record<string, number>` | `{}` | date → ms snapped on complete |
| `elapsedMs` | `number` | `0` | accumulated focus time for the **current** occurrence |
| `dueDate` | `string \| null` | `null` | `yyyy-MM-dd` next/current due; `null` if one-off |

A task is a habit iff `repeat !== null`.

Add to `CalendarEvent`:

| Field | Type | Default | Meaning |
|---|---|---|---|
| `boundWeekly` | `boolean` | `false` | member of a same-time weekly series |

`color` on `CalendarEvent` already exists. For habits, set it to `task.color`.

### 2.2 Palette (`lib/habits/palette.ts`)

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
```

`nextHabitColor(existingHexes: string[]): string` — first palette color not in `existingHexes`, else `HABIT_PALETTE[existingHexes.length % 8]`.

### 2.3 Collections and indexes

No new collections. No new composite indexes. Habits are `tasks` filtered client-side (`repeat != null`). Events stay queried by `userId`.

Firestore rules: unchanged shape. Habits are tasks. Series events are `calendar_events` with the same `userId` / owner checks.

### 2.4 Defaults in `docToTask` / `docToCalendarEvent`

```
repeat: data.repeat ?? null
habitStartedOn: data.habitStartedOn ?? null
color: data.color ?? null
sameTimeWeekly: data.sameTimeWeekly ?? false
lockedTime: data.lockedTime ?? null
checkIns: data.checkIns ?? {}
checkInElapsed: data.checkInElapsed ?? {}
elapsedMs: data.elapsedMs ?? 0
dueDate: data.dueDate ?? null
priority: data.priority ?? false   // already present
boundWeekly: data.boundWeekly ?? false  // on events
```

---

## 3. Pure logic (`lib/habits/logic.ts`)

All date keys are local `yyyy-MM-dd` via existing `formatDateKey`. Week is Monday–Sunday (`weekStartsOn: 1`), same as `getWeekRange`.

**Parse keys as local calendar dates.** Do not `parseISO('yyyy-MM-dd')` for due math — that is UTC midnight and shifts the weekday in negative-offset timezones.

```ts
export function parseDateKey(key: string): Date {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
}
```

Export `parseDateKey` from `lib/habits/logic.ts` (or `lib/utils/dates.ts`) and use it everywhere a key becomes a `Date`.

### 3.1 Due dates

```ts
export function isDueOn(rule: RepeatRule, dateKey: string, habitStartedOn: string): boolean
```

- `daily`: `dateKey >= habitStartedOn`
- `everyN`: days between `habitStartedOn` and `dateKey` is `>= 0` and `diff % n === 0`
- `weekdays`: `dateKey >= habitStartedOn` and `parseDateKey(dateKey).getDay()` is in `rule.days`

```ts
export function nextDueDate(rule: RepeatRule, fromDateKey: string, habitStartedOn: string): string
```

Smallest `dateKey > fromDateKey` that `isDueOn`. Scan forward one day at a time (max 366 iterations; throw if none — should not happen).

```ts
export function dueDaysInWeek(rule: RepeatRule, weekStartKey: string, habitStartedOn: string): string[]
```

The seven days starting `weekStartKey` (Monday) that `isDueOn`.

A habit is **overdue** when `dueDate < today` and `checkIns[dueDate]` is missing. It remains due until completed. It still appears on Tasks Today / All.

### 3.2 Check-ins and streaks

```ts
export function setCheckIn(
    checkIns: Record<string, CheckInLevel>,
    dateKey: string,
    level: CheckInLevel,
): Record<string, CheckInLevel>
```

Immutable spread. Overwrites.

```ts
export function clearCheckIn<T>(map: Record<string, T>, dateKey: string): Record<string, T>
export function undoTodayCheckIn(
    task: Pick<Task, 'repeat' | 'habitStartedOn' | 'checkIns' | 'checkInElapsed' | 'dueDate'>,
    todayKey: string,
): UndoTodayResult | null
```

`clearCheckIn` deletes one key (user undo only). No-op if missing.

`undoTodayCheckIn` returns `null` if today has no check-in. Otherwise drops today’s `checkIns` / `checkInElapsed` keys. **Un-roll** (`dueDate = todayKey`) only when today is due **and** `dueDate === nextDueDate(rule, todayKey)` — today’s complete moved the schedule. A mid-week intensity-only write on an already-rolled weekday habit must not pull `dueDate` back.

```ts
export function currentStreak(
    rule: RepeatRule,
    habitStartedOn: string,
    checkIns: Record<string, CheckInLevel>,
    todayKey: string,
): number
```

Walk due days backward from `todayKey` (if today is due) or from the last due day `<= todayKey`.

- Missing check-in on a due day → stop.
- Level `1` → do not increment, do not stop.
- Level `2` → increment.
- Non-due days are skipped.

```ts
export function bestStreak(
    rule: RepeatRule,
    habitStartedOn: string,
    checkIns: Record<string, CheckInLevel>,
    todayKey: string,
): number
```

Same scoring over the closed range `[habitStartedOn, todayKey]`: maximum run of due days in which no due day is missing, counting only `2`s toward the number. A `1` inside a run does not break the run.

### 3.3 Elapsed

```ts
export function displayedElapsedMs(task: {
    status: Task['status'];
    elapsedMs: number;
    startedAt: { toMillis?: () => number } | number | null;
}, nowMs: number): number
```

- If `status === 'started'` and `startedAt` is set: `elapsedMs + max(0, nowMs - startedAtMs)`
- Else: `elapsedMs`

`startedAtMs` = `startedAt.toMillis()` if present, else `Number(startedAt)`.

```ts
export function accumulateElapsed(elapsedMs: number, startedAtMs: number, nowMs: number): number
```

`elapsedMs + max(0, nowMs - startedAtMs)`

Reset (not-started): `elapsedMs = 0`, `startedAt = null`, `pausedAt = null`.

On habit roll, also leave `elapsedMs = 0` after snapping into `checkInElapsed[today]`.

One-off `done` keeps `elapsedMs` (do not zero). Also write `checkInElapsed[today] = displayedElapsedMs` so the recap can read one shape.

### 3.4 Roll

```ts
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
}): RollResult
```

1. `checkIns = setCheckIn(task.checkIns, todayKey, level)`
2. `snapped = displayedElapsedMs(task, nowMs)`
3. `checkInElapsed = { ...task.checkInElapsed, [todayKey]: snapped }`
4. `dueDate = nextDueDate(task.repeat!, todayKey, task.habitStartedOn!)` — next grid day after `todayKey`, not “today + N” re-anchored on a late complete.
5. Status fields reset as above. `calendarSlot` is copied through for the pure function; `completeHabit` then sets it to `null` when `!sameTimeWeekly` (today’s event stays in the store with `taskId`, so the calendar still shows it). When `sameTimeWeekly`, `syncWeeklySeries` resets the primary slot.

---

## 4. Application actions (client Firebase)

All actions stay `'use client'`, optimistic-first, same pattern as `lib/actions/tasks.ts`. Auth via `getCurrentUserId()`.

### 4.1 `lib/actions/habits.ts`

```ts
export async function setTaskRepeat(
    taskId: string,
    repeat: RepeatRule | null,
    extras?: { sameTimeWeekly?: boolean; color?: string | null },
): Promise<void>
```

- `repeat === null`: one-off. Clear `habitStartedOn`, `sameTimeWeekly`, `lockedTime`, `dueDate`. **Keep** `checkIns`, `checkInElapsed`, `color`. Delete bound weekly events except today’s primary (see 4.3).
- `repeat !== null`: if `habitStartedOn` is null, set it to today. If `color` is null, `nextHabitColor` from other habits. Set `dueDate` to today if `isDueOn` else `nextDueDate(repeat, yesterday, habitStartedOn)` — practically: first due day `>= today`. Apply `extras`.

```ts
export async function completeHabit(taskId: string, level: CheckInLevel): Promise<void>
```

Write `rollHabit`, then calendar: mark **today’s** event (if any, matching `date === today`) `status: 'completed'` and leave that event in place. If `!task.sameTimeWeekly`, set `calendarSlot: null` so the next occurrence is unscheduled (Inbox) and Start cannot revive yesterday’s block. If `sameTimeWeekly`, `syncWeeklySeries`. Confetti is UI’s job.

Firestore map fields: write **dotted keys** (`checkIns.${todayKey}`, `checkInElapsed.${todayKey}`) so a stale local map cannot wipe history. Optimistic store may still spread a full object.

```ts
export async function setCheckInLevel(taskId: string, dateKey: string, level: CheckInLevel): Promise<void>
```

Overwrite `checkIns[dateKey]`. Do **not** roll, do not change status, do not touch calendar.

```ts
export async function undoTodayCheckIn(taskId: string): Promise<void>
```

Apply `undoTodayCheckIn` from logic. Firestore: `deleteField()` on `checkIns.${today}` and `checkInElapsed.${today}`. If un-roll, write `dueDate = today`. If today’s calendar event exists, set it `scheduled`. If `calendarSlot` was cleared and that event exists, restore the slot from the event.

```ts
export async function setHabitColor(taskId: string, color: string): Promise<void>
```

Update task.color and all that task’s calendar events’ `color`.

```ts
export async function setSameTimeWeekly(taskId: string, enabled: boolean): Promise<void>
```

If enabling: set `sameTimeWeekly true`. If `calendarSlot` exists and `lockedTime` is missing, copy times from the slot. Call `syncWeeklySeries` (it no-ops without `lockedTime` — do **not** throw).  
If disabling: `sameTimeWeekly false`, clear `lockedTime`, `tearDownWeeklySeries(taskId, keepDateKey: today if today’s event exists else null)`.

### 4.2 `lib/actions/tasks.ts` changes

`CreateTaskInput` unchanged. `createTask` writes the new defaults (`repeat: null`, `elapsedMs: 0`, empty maps, etc.).

`updateTaskStatus(taskId, newStatus)`:

**First statement** when `newStatus === 'done'` and the task is a habit: `return completeHabit(taskId, 2)`. Do not write `status: 'done'` or `completedAt` first.

| New status | Extra behavior |
|---|---|
| `started` | Pause every other `started` task first. If that task’s `startedAt` is missing, set it `paused` and **leave `elapsedMs` unchanged** (do not accumulate from `0`). Then start this task. Write `startedAt` / `pausedAt` as `Timestamp.now()`, not `serverTimestamp()`, so the clock does not flicker to `null`. If habit and `checkIns[today]` missing → dotted write `checkIns.${today} = 1`. |
| `paused` | If `startedAt` is missing, set `paused` and keep `elapsedMs`. Else `elapsedMs = accumulateElapsed(...)`, then **clear `startedAt`**. |
| `default` | Zero clock: `elapsedMs = 0`, `startedAt = null`, `pausedAt = null`, `completedAt = null`. Do not change `checkIns`. |
| `done` | Habit: see first statement. One-off: current done + dotted `checkInElapsed.${today}`, keep `elapsedMs`. |

Pause-others-on-start is mandatory (one live timer).

`deleteTask`: delete **every** `calendar_events` doc with `taskId` (store + Firestore), not only `calendarSlot.eventId`. Requires the calendar store to be hydrated (app layout mounts `useCalendarEvents`).

`updateTask`: if `title` changes, fan the title out to **every** store event with that `taskId`, not only `calendarSlot.eventId`.

### 4.3 Series helpers (`lib/actions/habitSeries.ts`) + calendar hooks

Series functions live in **`lib/actions/habitSeries.ts`** (not `calendar.ts`) so `habits → habitSeries → calendar` does not cycle through `tasks`. `calendar.ts` may import `habitSeries` for drop/reschedule hooks.

```ts
export async function syncWeeklySeries(taskId: string): Promise<void>
```

No-op unless `task.sameTimeWeekly && task.repeat && task.lockedTime`.  
Let `days = dueDaysInWeek(rule, mondayOf(today), habitStartedOn)`.  
For each day: ensure an event exists with that `date`, `taskId`, `boundWeekly: true` (today’s existing event may be promoted: set `boundWeekly`). Times = `lockedTime`. Title = task.title. Color = task.color.  
Remove bound events this week whose date is not in `days` and is not a completed today (do not delete `status === 'completed'` today).  
Set `task.calendarSlot` to today’s event if today is in `days` or today has a completed event; else the next day in `days`; else null.

Call `syncWeeklySeries` from `ensureWeeklySeriesForOpenHabits()` after **both** the tasks store and the calendar store have finished their first snapshot (see frontend: mount `useCalendarEvents()` in the app layout). Dedup is “reuse event with same `taskId` + `date`.” Do not create a second event for that pair. There is no last-synced-week field.

```ts
export async function ensureWeeklySeriesForOpenHabits(): Promise<void>
```

For each habit with `sameTimeWeekly`, call `syncWeeklySeries`. Frontend calls this from the app layout after tasks hydrate (or from a tiny hook). Cheap: one user, few habits.

```ts
export async function tearDownWeeklySeries(taskId: string, keepDateKey: string | null): Promise<void>
```

Delete bound events for this task except `date === keepDateKey`.

`handleTaskDropOnCalendar`: after creating/updating the primary slot, if habit + `sameTimeWeekly`, set `lockedTime` from the dropped hour (hour→hour+1 via `addHour`) and `syncWeeklySeries`.

`rescheduleEvent`: if the event is `boundWeekly` (or the linked task `sameTimeWeekly`):

- Apply the **hour** of the drop to `lockedTime` and to **all** bound events for that task this week.
- Do **not** change other events’ dates.
- The dragged event’s date stays put. (If the drop date differs, ignore the date.)

If not bound: current behavior (move that one event + `calendarSlot`).

`updateCalendarEvent` used by `EventTimeEditor`: if bound / same-time, changing start/end updates `lockedTime` and all bound events’ times this week.

`setTaskSchedule`: if habit + sameTimeWeekly and schedule is set → `lockedTime` + `syncWeeklySeries`. If schedule is null → unschedule primary; if sameTimeWeekly still on, treat as disable of today’s block only or tear down — **if the user unschedules, turn off same-time and tear down**, keep the task unscheduled. Documented here: unscheduling a same-time habit disables the toggle.

### 4.4 Today recap (derived, no writes)

```ts
export function todayRecapItems(
    tasks: Task[],
    todayKey: string,
    nowMs: number,
): Array<{
    taskId: string;
    title: string;
    kind: 'habit' | 'oneoff';
    level: CheckInLevel | null; // habits only
    elapsedMs: number;
    inProgress: boolean;
}>
```

Include:

- Habit with `checkIns[todayKey]` or (`status === 'started'|'paused'` and (due today or overdue))
- One-off with `status === 'done'` and `completedAt` on `todayKey`, or `status === 'started'|'paused'`

`elapsedMs`: if in progress, `displayedElapsedMs`; else `checkInElapsed[todayKey] ?? (one-off done ? task.elapsedMs : 0)`.

Sort: in-progress first, then longer elapsed.

Empty list → recap hidden.

---

## 5. Functional requirements

### Habits

| ID | Requirement |
|---|---|
| FR-H1 | Fourth nav item Habits between Calendar and Notes. Routes `/habits` and `/habits/[id]`. |
| FR-H2 | Habits list shows every task with `repeat !== null`. |
| FR-H3 | Each row: title, habit color, rolling graph of **at least 30 days** ending today (if `habitStartedOn` is newer, pad empty days so the strip is still ~30). |
| FR-H4 | Graph cell color: empty = token muted square; `1` = habit color at ~40% opacity; `2` = habit color at 100%. |
| FR-H5 | Due / overdue unfinished habits sort above the rest. |
| FR-H6 | Tap row (not the complete control) → `/habits/[id]`. |
| FR-H7 | Complete control opens a compact chooser: Partial (`1`) / Full (`2`), then `completeHabit`. Allowed even if never started. |
| FR-H8 | Complete-control discriminator is **already rolled**, not “has a check-in.” If `dueDate > today` (rolled; today already logged), the chooser calls `setCheckInLevel` and does not roll again. If `dueDate <= today` (due or overdue, including a started habit whose `checkIns[today] === 1`), the chooser calls `completeHabit`. Start writing `1` must not block roll. |
| FR-H9 | Detail page: full-history graph from `habitStartedOn` through today, paging month calendar (cells use same 0/1/2 colors), current streak, best streak, edit. |
| FR-H10 | Create via Habits FAB. Edit via detail. Fields: title, repeat (daily / every N / weekdays), color (palette), same-time weekly. |
| FR-H11 | Task form Repeat section is the same convert/create path (`setTaskRepeat`). |
| FR-H12 | Intensity chooser offers **Clear today** when today has a check-in. Calls `undoTodayCheckIn`. Partial↔Full still uses FR-H8. |
| FR-H13 | Delete habit uses the shared confirm + `deleteTask` (habit + every calendar event). Buttons on habit detail and the edit form. Repeat Off still converts to a one-off and keeps history. |

### Tasks / calendar sync

| ID | Requirement |
|---|---|
| FR-S1 | Task filters after this overhaul: **Today** = one-offs with `calendarSlot.date === today` (not done) **or** habits with `dueDate <= today` (due or overdue). **Upcoming** = one-offs with a future slot **or** habits with `dueDate > today`. **Inbox** (Tasks filter **and** calendar tray) = no `calendarSlot` and not done, **excluding** habits with `dueDate > today`. **All** = not done, **excluding** habits with `dueDate > today`. **Done** = one-off `status === 'done'` only; rolled habits are not listed here. Overdue habits stay on Today and All until completed. |
| FR-S2 | Tasks/Calendar Done on a habit calls `completeHabit(..., 2)`. No chooser. Status modal Done stays one option. |
| FR-S3 | Start anywhere writes light check-in if today empty. |
| FR-S4 | Today’s calendar event remains after complete, `status: 'completed'`. |
| FR-S5 | Same-time weekly behavior per §4.3. |
| FR-S6 | Unscheduled tray lists **all** unscheduled incomplete tasks, horizontally scrollable, scrollbar hidden. Pointer/touch activation must allow a horizontal pan to scroll. |

### Timer and recap

| ID | Requirement |
|---|---|
| FR-T1 | Displayed time = `displayedElapsedMs`. Calendar banner and Tasks pill share it. |
| FR-T2 | Pause accumulates. Not-started zeros the clock. |
| FR-T3 | Starting a task pauses any other `started` task first. |
| FR-T4 | Tasks All-filter pill: live title + elapsed on the right. Hidden when no started task. |
| FR-T5 | Tap pill → full-page focus overlay (ring + count-up + title + pause/resume + done). Spring / shared-element feel; not a hard cut. |
| FR-T6 | Overlay dismiss: back control or slide **down** (same thresholds as `NoteOverlay`: offset.y > 120 or velocity.y > 600) → pill. |
| FR-T7 | While overlay is open, request Screen Wake Lock if available; always compute time from timestamps so sleep cannot lose minutes. |
| FR-T8 | Today recap at bottom of Tasks per `todayRecapItems`. Hidden if empty. Shows elapsed and a total. |

### Storage

| ID | Requirement |
|---|---|
| FR-D1 | No `reports` collection. Recap is derived. |
| FR-D2 | Do not auto-delete keys from `checkIns` / `checkInElapsed`. User undo of today may `deleteField` those two keys for today only. |
| FR-D3 | Do not add automatic prune of one-off tasks in this overhaul. |

---

## 6. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | Single user, Firestore Spark. Extra habit fields are maps on existing task docs. |
| NFR-2 | No new npm dependencies. |
| NFR-3 | Optimistic updates on every write. Match current action style. |
| NFR-4 | Motion uses existing `lib/utils/animations.ts` tokens (`easing.premium`, `duration.*`) and CSS `--ease`. |
| NFR-5 | AMOLED / dark / light: habit colors are hex on the graph; chrome uses existing tokens. |
| NFR-6 | Mobile nav must fit four items without overflow (narrower tabs if needed). |
| NFR-7 | Touch targets ≥ 40px on complete, pill, overlay controls. |
| NFR-8 | Backend self-check covers due, nextDue, roll, elapsed, streaks, week days. |

---

## 7. Threat model

Authenticated owner only, same as today. New fields are user-owned maps on `tasks` / flags on `calendar_events`. Worst case if spoofed: the user damages their own habit history. No extra public surface. No URL fetch, no uploads. Title strings already accepted on tasks.

---

## 8. Boundaries

**Always**

- Habit = repeating task.
- One write path for complete (`completeHabit`).
- One live timer.
- Keep habit history.

**Ask first**

- New dependencies.
- New Firestore collections.
- Changing streak rules.
- Pruning old one-off tasks.

**Never**

- Insights page / reports collection.
- Quantity targets.
- Popup chooser on Tasks Done.
- Splitting the Tasks Done control into Partial/Full.
- Restarting the calendar timer from zero on pause/resume.
- Deleting today’s completed calendar block on roll.

---

## 9. File map

### Backend (Sonnet)

| File | Role |
|---|---|
| `lib/firebase/firestore.ts` | Types + `docTo*` defaults |
| `lib/habits/palette.ts` | Palette + `nextHabitColor` |
| `lib/habits/logic.ts` | Pure due / streak / elapsed / roll / recap |
| `lib/habits/logic.selfcheck.ts` | Assert self-check |
| `lib/actions/habits.ts` | Repeat, complete, intensity, color, same-time |
| `lib/actions/habitSeries.ts` | `syncWeeklySeries`, `tearDownWeeklySeries`, `ensureWeeklySeriesForOpenHabits` |
| `lib/actions/tasks.ts` | Status machine, pause-others, delete all events, title fan-out, create defaults |
| `lib/actions/calendar.ts` | Drop/reschedule/schedule hooks that call habitSeries |
| `README.md` | Field notes only if the existing type table is updated |

### Frontend (Gemini)

| File | Role |
|---|---|
| `components/layout/navConfig.tsx` | Fourth tab + pageMeta |
| `components/layout/MobileNav.tsx` | Four-item fit + Habits FAB |
| `components/layout/RailTopbar.tsx` | New Habit button |
| `components/layout/Sidebar.tsx` | Picks up navItems |
| `app/(app)/layout.tsx` | Mount `useCalendarEvents()` + `useTasks()`, then `ensureWeeklySeriesForOpenHabits` when both `loading === false`; host focus overlay |
| `app/(app)/habits/page.tsx` | List |
| `app/(app)/habits/[id]/page.tsx` | Detail |
| `components/habits/*` | Row, graph, chooser, month calendar, form |
| `components/tasks/TaskForm.tsx` | Repeat + same-time |
| `components/tasks/TaskList.tsx` | Pill + recap; due-habit filter |
| `components/tasks/TodayRecap.tsx` | Recap list |
| `components/focus/FocusPill.tsx` | Pill |
| `components/focus/FocusOverlay.tsx` | Full-page clock |
| `components/calendar/ActiveTaskBanner.tsx` | Shared elapsed |
| `components/calendar/DailyCalendar.tsx` | Inbox scroll + no 8-cap |
| `lib/store/app.ts` | `focusTaskId`, habit form modal flags if needed |
| `lib/hooks/useHabits.ts` | Filter habits from the tasks store |

---

## 10. Open questions

None. Decisions in the PRD §6 are closed. If implementation hits an unlisted edge, stop and ask; do not invent a third intensity or a new collection.

---

## 11. Requirement → plan map

| Requirements | Plan |
|---|---|
| Data model, §3–4, FR-S2, FR-S3, FR-S4, FR-S5 (writes), FR-T1–T3, FR-D1–D3, NFR-8 | `plan-backend.md` |
| FR-H1–H11, FR-S1 (display), FR-S6, FR-T4–T8, NFR-4–NFR-7 | `plan-frontend.md` |
