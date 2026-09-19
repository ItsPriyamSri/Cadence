# Cadence Overhaul — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Model:** Gemini 3.8 Flash. You own screens, motion, and chrome. You do **not** invent Firestore writes, new fields, or new action names.
>
> **Prerequisite:** Backend pass is done. If an import below is missing, **stop**. Do not stub a second write path.
>
> **Contract:** `docs/cadence-overhaul/SRS.md` wins over this plan if they ever differ. Visual reference: Habitify-style **left** phone (list + colored graphs) and **middle** phone (detail + month calendar). Not the Insights phone.

**Goal:** A Habits tab that looks like the reference list, a full-history detail page, Repeat on the task form, a Today recap, a desk-ready focus clock, and a scrollable calendar inbox — all talking to the existing actions.

**Architecture:** Habits are tasks already in `useTasksStore`. UI filters them. One focus overlay lives in the app shell. Graphs are div grids, not a chart library.

**Tech Stack:** Next.js App Router, React 19, Tailwind tokens already in `app/globals.css`, Framer Motion, lucide-react, existing `cn`, `fadeIn`, `easing.premium`. No new packages.

## Global Constraints

- No new npm dependencies.
- Import writes only from `@/lib/actions/habits`, `@/lib/actions/tasks`, `@/lib/actions/calendar`, `@/lib/actions/habitSeries`.
- Import logic only from `@/lib/habits/logic` and `@/lib/habits/palette`.
- Do not add a `reports` collection, Insights route, or quantity UI.
- Tasks Done stays one control. No Partial/Full on the task card or status modal.
- Motion: `easing.premium` / `[0.22, 1, 0.36, 1]`, `duration.normal` / `fast`. Copy `NoteOverlay` for the focus slide-down.
- Four nav items must fit on a 390px-wide phone. Prefer `w-16` (64px) tabs over today’s `w-[72px]` if they overflow.
- Touch targets ≥ 40px on complete, FAB, overlay controls.
- AMOLED: graphs use the habit hex; chrome uses `--bg-*`, `--text-*`, `--border`.
- Do not add Cursor / Co-authored-by trailers to commits.
- Every task’s requirements include this section.

### Allowed imports (frozen)

```ts
// lib/habits/logic.ts
parseDateKey, isDueOn, nextDueDate, dueDaysInWeek, currentStreak, bestStreak,
displayedElapsedMs, todayRecapItems, weekStartKey

// lib/habits/palette.ts
HABIT_PALETTE, nextHabitColor

// lib/actions/habits.ts
setTaskRepeat, completeHabit, setCheckInLevel, setHabitColor, setSameTimeWeekly

// lib/actions/tasks.ts
createTask, updateTask, updateTaskStatus, deleteTask

// lib/actions/habitSeries.ts
ensureWeeklySeriesForOpenHabits

// lib/actions/calendar.ts
setTaskSchedule

// lib/utils/dates.ts
formatDateKey, formatElapsed, addDays, subDays
```

If a name is missing, stop.

---

### Task 1: Nav + habit routes + weekly ensure

**Files:**
- Modify: `components/layout/navConfig.tsx`
- Modify: `components/layout/MobileNav.tsx`
- Modify: `components/layout/RailTopbar.tsx`
- Modify: `lib/store/app.ts`
- Modify: `app/(app)/layout.tsx`
- Create: `app/(app)/habits/page.tsx` (placeholder list shell)
- Create: `app/(app)/habits/[id]/page.tsx` (placeholder)
- Create: `lib/hooks/useHabits.ts`

**Interfaces:**
- Consumes: `navItems`, `pageMeta`, `tabFromPathname`, `ensureWeeklySeriesForOpenHabits`, `useTasks`
- Produces: `tab` includes `'habits'`; `/habits` renders; FAB on habits opens habit form (store flag)

- [ ] **Step 1: Extend nav types**

`navConfig.tsx`:

```ts
import { CheckSquare, Calendar, FileText, Repeat, LucideIcon } from 'lucide-react';

export interface NavItem {
    href: string;
    tab: 'tasks' | 'calendar' | 'habits' | 'notes';
    label: string;
    icon: LucideIcon;
}

export const navItems: NavItem[] = [
    { href: '/tasks', tab: 'tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/calendar', tab: 'calendar', label: 'Calendar', icon: Calendar },
    { href: '/habits', tab: 'habits', label: 'Habits', icon: Repeat },
    { href: '/notes', tab: 'notes', label: 'Notes', icon: FileText },
];

export const pageMeta: Record<NavItem['tab'], { title: string; subtitle: string }> = {
    tasks: { title: 'Tasks', subtitle: 'Start something. Momentum follows.' },
    calendar: { title: 'Calendar', subtitle: 'Plan and time-block your day.' },
    habits: { title: 'Habits', subtitle: 'Show up. The graph remembers.' },
    notes: { title: 'Brain Dump', subtitle: 'Capture thoughts and track goals.' },
};

export function tabFromPathname(pathname: string): NavItem['tab'] {
    if (pathname.startsWith('/calendar')) return 'calendar';
    if (pathname.startsWith('/habits')) return 'habits';
    if (pathname.startsWith('/notes')) return 'notes';
    return 'tasks';
}
```

`useAppStore.activeTab` type: add `'habits'`.

- [ ] **Step 2: Fit four mobile tabs + Habits FAB**

In `MobileNav.tsx`:

- Change tab width from `w-[72px]` to `w-16` (or `w-[64px]`).
- `showFab` true for `tasks`, `notes`, **and `habits`**.
- Habits FAB calls `openHabitForm()` (add to `app.ts` the same shape as `openTaskForm`: `isHabitFormOpen`, `editingHabitId`, `openHabitForm`, `closeHabitForm`).
- `aria-label` for habits FAB: `New Habit`.

`RailTopbar.tsx`: when `tab === 'habits'`, show `New Habit` using the same accent button classes as New Task.

- [ ] **Step 3: `useHabits` and placeholder pages**

```ts
// lib/hooks/useHabits.ts
export function useHabits() {
    const { tasks, loading } = useTasks();
    const habits = tasks.filter((t) => t.repeat != null);
    return { habits, loading };
}
```

List page: `fadeIn` wrapper, `max-w-[820px] mx-auto` same as Tasks, mobile `h1` “Habits”. Empty state: “No habits yet” + button that opens the habit form.

Detail placeholder: read `params.id`, if missing habit show “Habit not found” + link to `/habits`.

- [ ] **Step 4: Hydrate calendar in the shell, then ensure series**

In `app/(app)/layout.tsx` (authenticated tree), call **both** `useTasks()` and `useCalendarEvents()` so `deleteTask` / series sync / color fan-out see events on every route — not only `/calendar`.

```ts
const { loading: tasksLoading } = useTasks();
const { loading: eventsLoading } = useCalendarEvents();

useEffect(() => {
    if (tasksLoading || eventsLoading) return;
    ensureWeeklySeriesForOpenHabits().catch((e) => console.error(e));
}, [tasksLoading, eventsLoading, habitsSignature]);
```

`habitsSignature` = habits mapped to `id + sameTimeWeekly + dueDate + lockedTime` joined. Do not call on every task title change.

- [ ] **Step 5: Commit**

```bash
git add components/layout/navConfig.tsx components/layout/MobileNav.tsx components/layout/RailTopbar.tsx lib/store/app.ts app/\(app\)/layout.tsx app/\(app\)/habits lib/hooks/useHabits.ts
git commit -m "$(cat <<'EOF'
Add the Habits tab and weekly series refresh in the app shell.

EOF
)"
```

---

### Task 2: Contribution graph + habit row + intensity chooser

**Files:**
- Create: `components/habits/ContributionGraph.tsx`
- Create: `components/habits/IntensityChooser.tsx`
- Create: `components/habits/HabitRow.tsx`

**Interfaces:**
- Consumes: `completeHabit`, `setCheckInLevel`, `formatDateKey`, `addDays` / `subDays`
- Produces: presentational graph; row used by the list

- [ ] **Step 1: `ContributionGraph`**

Props:

```ts
{
    color: string;                          // habit hex
    checkIns: Record<string, 1 | 2>;
    days: string[];                         // date keys left → right (oldest → today)
    cell?: number;                          // default 8
}
```

Render a wrapping flex/grid of squares (`rounded-[2px]`), `gap-[3px]`. Empty: `bg-bg-tertiary` / `opacity-80`. Level 1: `background: color` + `opacity: 0.4`. Level 2: `background: color` + `opacity: 1`. `aria-hidden` on the grid; each cell `title={date}`.

List window helper (same file or `components/habits/graphDays.ts`):

```ts
export function rollingDays(todayKey: string, count = 35): string[] {
    // todayKey and the previous count-1 days, oldest first
}
```

Always pass **35** days on the list even if `habitStartedOn` is yesterday (leading empties). That is the “never empty month” look.

- [ ] **Step 2: `IntensityChooser`**

Compact bottom sheet / small modal using existing `Modal` if it looks native; otherwise a 2-button popover anchored to the row.

Copy:

- Title: `How did today go?`
- If `habit.dueDate > today` (already rolled): Partial/Full → `setCheckInLevel(id, today, 1|2)` only
- If `habit.dueDate <= today` (due/overdue, **including** a started habit with `checkIns[today] === 1`): Partial/Full → `completeHabit(id, 1|2)`
- Never use “has a check-in today” as the discriminator — Start writes `1` and must still be able to roll

Buttons: left “Partial” (habit color at 40%), right “Full” (habit color 100%, white text). Min height 44px.

- [ ] **Step 3: `HabitRow`**

Layout (reference left phone):

```
[ tinted icon or 10px color dot ]  Title
                                   due hint (Today / Every 2 days / Mon · Wed · Fri)
[ rolling graph ]
[ complete control 40×40 ]
```

- Card: `rounded-lg bg-bg-primary border border-border shadow-elev-1 p-4`
- Complete control: circle, habit color ring; filled if `checkIns[today] === 2`; half-filled / opacity if `1`; empty if missing
- Click complete → chooser (stopPropagation)
- Click rest of row → `router.push(/habits/${id})`
- Due / overdue unfinished (`dueDate <= today` && !`checkIns[today]`) get a left stripe `4px` in habit color

- [ ] **Step 4: Commit**

```bash
git add components/habits
git commit -m "$(cat <<'EOF'
Add habit rows, contribution cells, and the partial/full chooser.

EOF
)"
```

---

### Task 3: Habits list and detail

**Files:**
- Modify: `app/(app)/habits/page.tsx`
- Modify: `app/(app)/habits/[id]/page.tsx`
- Create: `components/habits/HabitMonthCalendar.tsx`
- Create: `components/habits/HabitForm.tsx`

**Interfaces:**
- Consumes: `useHabits`, `HabitRow`, `currentStreak`, `bestStreak`, `setTaskRepeat`, `setHabitColor`, `setSameTimeWeekly`, `updateTask`, `HABIT_PALETTE`
- Produces: finished list + detail + create/edit form

- [ ] **Step 1: List page**

Sort: unfinished due/overdue first (`dueDate <= today && !checkIns[today]`), then title.

Map `HabitRow`. Loading: `CadenceLoader`.

Mount `Modal` + `HabitForm` when `isHabitFormOpen` (create) — same pattern as Tasks page + `TaskForm`.

- [ ] **Step 2: `HabitForm`**

Fields (match `TaskForm` field classes):

- Title
- Repeat: segmented **Off / Daily / Every N / Weekdays**
  - Every N: number input `min=2` default 2
  - Weekdays: 7 toggles S M T W T F S mapped to `0..6`
- Color: 8 swatches from `HABIT_PALETTE`
- Same time this week: toggle, helper text “Once you schedule it, this week’s due days share that clock. Next week fills itself.”
- Submit create: `createTask({ title })` then `setTaskRepeat(id, rule, { sameTimeWeekly, color })`
- Submit edit: `updateTask` title, `setTaskRepeat`, `setHabitColor`, `setSameTimeWeekly`
- Off on edit: `setTaskRepeat(id, null)` then `close` and `router.push('/habits')` if we are on detail

Do not ask for a time in this form. Time is set by scheduling on Calendar / task schedule.

- [ ] **Step 3: Month calendar + detail**

`HabitMonthCalendar`: one month grid, Monday-first (to match week logic). Prev/next month chevrons. Days before `habitStartedOn` muted. Cells: same 0/1/2 coloring as the graph. Tapping a **today** cell with an existing check-in opens `IntensityChooser` (edit). Tapping other days does nothing in v1.

Detail page sections, top to bottom:

1. Back to Habits
2. Title + color dot
3. Current streak and best streak (`currentStreak` / `bestStreak`) — large numbers, `text-xl font-bold`
4. Rolling or full-history `ContributionGraph` with days from `habitStartedOn` through today (if that span is shorter than 35 days, still pad to 35 for density)
5. `HabitMonthCalendar`
6. Edit button → `openHabitForm(id)`

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/habits components/habits
git commit -m "$(cat <<'EOF'
Ship the Habits list, detail history, and habit form.

EOF
)"
```

---

### Task 4: Task form Repeat + Tasks list due rules + recap

**Files:**
- Modify: `components/tasks/TaskForm.tsx`
- Modify: `components/tasks/TaskList.tsx`
- Modify: `components/tasks/TaskFilters.tsx`
- Create: `components/tasks/TodayRecap.tsx`

**Interfaces:**
- Consumes: `setTaskRepeat`, `setSameTimeWeekly`, `todayRecapItems`, `formatElapsed`
- Produces: convert-to-habit on the form; Today filter includes due habits; recap at the bottom

- [ ] **Step 1: Repeat block on `TaskForm`**

Place it after Schedule, before goal. Same control language as `HabitForm` (Off / Daily / Every N / Weekdays + same-time toggle). On submit, after `createTask`/`updateTask` and `setTaskSchedule`, call `setTaskRepeat` / `setSameTimeWeekly`.

If Repeat is Off, `setTaskRepeat(id, null)` on edit so converting back works.

- [ ] **Step 2: Visibility helpers in TaskList / TaskFilters**

Today key = `format(new Date(), 'yyyy-MM-dd')`.

A habit is **active for planning** when `repeat != null && dueDate && dueDate <= today` (due or overdue). After roll, `dueDate` is in the future so it leaves Today / All-as-open.

Update filters:

- `today`: one-off with `calendarSlot.date === today && status !== 'done'` **OR** active-for-planning habit
- `upcoming`: one-off future slot **OR** habit with `dueDate > today`
- `unscheduled`: `!calendarSlot && status !== 'done'` (habits included)
- `all`: not done, **excluding** habits with `dueDate > today`
- `completed`: one-off `done` plus do **not** list rolled habits (they are `default`). Recap covers today’s habit completions.

- [ ] **Step 3: `TodayRecap`**

Bottom of `TaskList` (all filters, or at least `all` and `today` — implement on **every** filter so the day total is always findable; hide the component when `items.length === 0`).

```ts
const items = todayRecapItems(tasks, todayKey, Date.now());
const total = items.reduce((s, i) => s + i.elapsedMs, 0);
```

Header: `Today` + `formatElapsed(Math.floor(total / 1000))`.  
Rows: title, habit light/dark chip if `kind === 'habit'`, elapsed, “In progress” if `inProgress`. Use `opacity-70` for finished rows. No extra writes.

- [ ] **Step 4: Commit**

```bash
git add components/tasks
git commit -m "$(cat <<'EOF'
Add Repeat on tasks and a live Today recap.

EOF
)"
```

---

### Task 5: Focus pill, overlay, shared elapsed

**Files:**
- Create: `components/focus/FocusPill.tsx`
- Create: `components/focus/FocusOverlay.tsx`
- Create: `components/focus/useDisplayedElapsed.ts`
- Modify: `components/tasks/TaskList.tsx` (replace the count-only banner)
- Modify: `components/calendar/ActiveTaskBanner.tsx`
- Modify: `app/(app)/layout.tsx`
- Modify: `lib/store/app.ts`

**Interfaces:**
- Consumes: `displayedElapsedMs`, `updateTaskStatus`, `useActiveTasks` (after backend, only one started task should exist; still take `[0]`)
- Produces: pill ↔ overlay

- [ ] **Step 1: `useDisplayedElapsed(task)`**

Hook: 1s interval, `displayedElapsedMs(task, Date.now())`, return seconds for `formatElapsed`. Depend on `task.id`, `task.status`, `task.elapsedMs`, `task.startedAt`.

- [ ] **Step 2: Store**

```ts
focusOpen: boolean
openFocus: () => void
closeFocus: () => void
```

- [ ] **Step 3: `FocusPill`**

Replace the Tasks “N tasks in progress” block when `taskFilter === 'all'` (and also show the pill on other filters if a task is started — always show when started).

Row: live dot (`animate-cad-live`) + title (`font-semibold truncate`) + `formatElapsed` on the **right** (`font-mono font-bold text-started tabular-nums`) + chevron. Background: current started-banner classes.

`onClick={openFocus}`. `aria-label="Open focus timer"`.

- [ ] **Step 4: `FocusOverlay`**

Mount in `app/(app)/layout.tsx` next to `Confetti`. Open when `focusOpen && activeTask`.

Visual:

- Full viewport `bg-bg-primary` (AMOLED black)
- Grab handle identical to `NoteOverlay`
- `drag="y"` dismiss: `offset.y > 120 || velocity.y > 600` → `closeFocus`
- Back button “Tasks” / “Close”
- Title centered `text-lg font-bold`
- Ring: `width: min(72vw, 320px)` circle, `border-[10px]`, color `--started`, inner `formatElapsed` at `text-5xl font-bold tabular-nums tracking-tight`
- Tap ring toggles pause/resume (`updateTaskStatus` paused ↔ started)
- Bottom: Pause/Resume + Done (Done → `updateTaskStatus(id, 'done')`, `triggerConfetti`, `closeFocus`)

Enter/exit: `y: '100%' → 0` with `duration: 0.35, ease: [0.22, 1, 0.36, 1]` — same family as notes, “slide up from the pill.”

Wake Lock:

```ts
useEffect(() => {
    if (!open) return;
    let sentinel: WakeLockSentinel | undefined;
    const req = async () => {
        try { sentinel = await navigator.wakeLock?.request('screen'); } catch { /* unsupported */ }
    };
    req();
    const onVis = () => { if (document.visibilityState === 'visible') req(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
        document.removeEventListener('visibilitychange', onVis);
        sentinel?.release();
    };
}, [open]);
```

Time must still be correct if Wake Lock fails (timestamps).

- [ ] **Step 5: Calendar banner**

Replace local `ElapsedTime` that diffs only `startedAt` with `useDisplayedElapsed(activeTask)` so pause does not jump to a raw `startedAt` clock.

The whole banner header (title + elapsed) calls `openFocus`. Remove the in-banner pause/done expand row — those controls live on the overlay. The banner is only a compact live clock + entry to focus.

- [ ] **Step 6: Commit**

```bash
git add components/focus components/tasks/TaskList.tsx components/calendar/ActiveTaskBanner.tsx app/\(app\)/layout.tsx lib/store/app.ts
git commit -m "$(cat <<'EOF'
Add a shared elapsed clock and a full-page focus overlay.

EOF
)"
```

---

### Task 6: Calendar inbox scroll

**Files:**
- Modify: `components/calendar/DailyCalendar.tsx`

**Interfaces:**
- Consumes: existing `unscheduledTasks`, dnd-kit sensors
- Produces: all chips visible via hidden horizontal scroll; swipe pans, committed move still drags

- [ ] **Step 1: Remove the 8-item cap**

Delete `.slice(0, 8)` and the `+N more` span.

Change the unscheduled list to the same rule as the Tasks Inbox filter: `!calendarSlot && status !== 'done'`, **excluding** habits with `dueDate > today`. Then render every remaining chip.

- [ ] **Step 2: Make the tray actually scroll**

On the tray container:

```
className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 min-w-0 touch-pan-x"
```

Ensure every ancestor down from the tray to the column has `min-w-0` (the timeline column already does). Chips: `shrink-0`.

Sensors: keep `PointerSensor` `distance: 8`. Change `TouchSensor` to `{ activationConstraint: { distance: 12 } }` (drop the 150ms delay so a horizontal flick scrolls instead of waiting). If drag-from-tray onto the timeline breaks, revert TouchSensor to `{ delay: 180, tolerance: 12 }` — scroll still wins for mostly-horizontal moves.

- [ ] **Step 3: Commit**

```bash
git add components/calendar/DailyCalendar.tsx
git commit -m "$(cat <<'EOF'
Let the calendar inbox scroll sideways without a visible scrollbar.

EOF
)"
```

---

### Task 7: Frontend verification (browser)

Do not declare this pass done without exercising the UI.

- [ ] **Step 1: Run the app**

```bash
npm run dev
```

- [ ] **Step 2: Manual script (use the browser)**

1. Nav shows four items; Habits opens; empty state works.
2. Create a daily habit from the FAB. It appears with a palette color and a 35-cell strip.
3. Convert a one-off task via Repeat. It appears on Habits.
4. Start the habit from Tasks → list cell goes light; pill shows a live timer.
5. Open the pill → overlay; pause; wait; resume; number continued. Slide down → pill.
6. From Habits, complete that **started** habit (chooser → Full) → it **rolls** (dueDate advances, leaves Today). Do not only recolor.
7. Done from Tasks on another habit → dark cell, leaves Today, recap shows it, no chooser.
8. Complete a habit from Habits without starting → chooser → Partial → light + roll.
9. Reopen chooser on that row → switch to Full without a second roll.
10. Detail shows streak numbers and a month grid; color change updates the graph.
11. Enable same-time, schedule on Calendar, confirm other due days this week get blocks; drag the hour; all times move, dates stay.
12. Inbox with >8 unscheduled tasks: swipe sideways, last chip reachable, no scrollbar thumb.
13. Start task A, start task B: A is paused, one clock, B is on the pill.

If a step fails because a backend export is wrong, stop and report the missing symbol. Do not reimplement roll in the component.

- [ ] **Step 3: Commit only follow-up UI fixes**

---

## Spec coverage (self-review)

| SRS | Task |
|---|---|
| FR-H1, NFR-6 | 1 |
| FR-H3 H4 H6 H7 H8 | 2 |
| FR-H2 H5 H9 H10 H11 | 3 |
| FR-S1, FR-T8 | 4 |
| FR-T4–T7, FR-T1 display | 5 |
| FR-S6 | 6 |
| FR-S2 S3 S4 S5 writes | backend — UI only calls them |
| Insights / reports | never added |
