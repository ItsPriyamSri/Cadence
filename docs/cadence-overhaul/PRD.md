# Cadence Overhaul — Product Requirements Document

**Product:** Cadence  
**Document:** PRD  
**Version:** 1.0  
**Date:** 2026-09-19  
**Status:** Locked for implementation (pending review + go signal)

## 1. Problem

Cadence already works as a personal daily driver: notes to capture, tasks to plan, calendar to time-block. It is not opened every day. There is no reason to come back, no visible streak of showing up, and the in-progress state does not feel like a session you can sit with.

## 2. Product stance

Cadence is not a tasks app, not a habits app, and not a notes app. It is the combination: capture (notes), plan (tasks), time-block (calendar), return (habits), and stay (focus timer).

Habits are not a second product. **A habit is a repeating task.** Same title, same start / pause / done, same calendar block. The Habits page is a view of those tasks plus a contribution graph. Completing a habit from Tasks, Calendar, or Habits is one write.

Goals on Notes stay outcomes. They are not habits.

## 3. Goals

1. Make opening Cadence rewarding: a colored contribution graph that is never an empty month.
2. Let any task become a habit (repeat daily, every N days, or on chosen weekdays) without a second object or a second checkbox.
3. Keep Tasks, Calendar, and Habits in lockstep. No manual “also mark the habit.”
4. Put a real count-up focus clock on the desk: one live task, pause keeps time, not-started zeros it, expand/collapse with a premium transition.
5. Stay on Firebase Spark for a single user. No reports warehouse.

## 4. Non-goals

- Insights / weekly-monthly-yearly dashboard (the right phone in the Habitify reference)
- Stored daily report documents
- Quantity habits (4/8 glasses)
- Full RRULE (monthly, “first Monday,” end dates)
- Skip button
- Auto-wipe of habit history
- Paid-plan migration features
- New npm dependencies
- A fifth nav tab

## 5. Users and context

One authenticated user (the owner). PWA, mobile-first, AMOLED dark is the default love. Premium motion is part of the product, not polish to add later.

## 6. Locked decisions

| Topic | Decision |
|---|---|
| Identity | Habit **is** a repeating task (`repeat !== null`) |
| Today recap | Section at the **bottom of `/tasks`**, today-only, computed live |
| Tasks filters | All hides habits not yet due again; those sit in Upcoming until the next due day |
| Habits list | Own nav page `/habits`, all habits, like the left reference phone |
| Habit detail | `/habits/[id]`, history from the day repeat was turned on |
| Repeat rules | Daily · every N days · specific weekdays |
| Complete → roll | Immediate. Status returns to not-started. Next due is the next matching day on the **repeat grid** (anchored at `habitStartedOn`). A late completion does **not** re-anchor `everyN`. Missed due days stay empty. |
| Calendar after complete | Today’s event **stays** as completed. Next occurrence unscheduled unless same-time weekly is on. |
| Same-time weekly | Optional toggle. Fills due days in the current Mon–Sun week at the locked clock time. Each new week refills while the toggle stays on. Moving **time** on one bound event moves all bound events this week. Changing **date** does not move the series. Uncheck deletes this week’s other bound events; today stays. |
| Intensity | `1` = light, `2` = dark. Start (any page) writes `1` if today is empty. Habits complete asks Partial / Full. Tasks / Calendar **Done** writes `2` with no popup and no split control. Today’s cell can be edited `1` ↔ `2` later; that does not un-roll. **Clear today** removes today’s check-in and un-rolls only if today’s complete moved `dueDate`. |
| Colors | Auto from a fixed palette; changeable on edit |
| Create / convert | Habits FAB **and** Repeat section on the task form. Same fields. |
| Timer | One live clock. Starting task B pauses task A. `elapsedMs` is truth. Calendar banner uses the same clock. |
| Focus UI | Tasks pill shows title + elapsed; tap expands to full-page ring; slide down / back collapses to the pill. |
| Storage | `checkIns` kept from `habitStartedOn`. No `reports` collection. Do not auto-prune habit history. User undo may drop today’s keys. |
| Delete | Confirm, then hard-delete the habit and all its calendar events (`deleteTask`). Repeat Off still converts to a one-off and keeps history. |
| Inbox tray | All unscheduled tasks, hidden horizontal scroll, drag starts after a short movement. |

## 7. Surfaces

1. **`/tasks`** — planner + in-progress pill + Today recap at the bottom.
2. **`/calendar`** — day timeline; completed habit blocks remain; same-time series; shared focus banner.
3. **`/habits`** — every repeating task, rolling ~30-day graph, complete control.
4. **`/habits/[id]`** — one habit, full history, month calendar, streaks, edit, delete.
5. **Focus overlay** — full-page count-up, hosted in the app shell so Tasks and Calendar share it.

Nav order: Tasks · Calendar · Habits · Notes.

## 8. Success

The overhaul is successful when:

- A one-off task can be turned into a habit from the task form and appears on Habits with a color and an empty-but-ready graph.
- Completing that habit from Tasks darkens today and the task is gone from the active list, visible on the recap, and due again on the next matching day without being re-created.
- Completing from Habits offers Partial / Full even if the task was never started.
- The graph always shows at least the last 30 days (sliding window on the list).
- The Tasks pill shows a live timer; opening it is a continuous transition to a desk-sized clock; pause/resume keeps the number; not-started is `0:00`.
- Starting a second task pauses the first.
- Firebase still has only the existing collections (`tasks`, `calendar_events`, `notes`, `goals`, `users`).

## 9. Implementation split

| Pass | Model | Owns |
|---|---|---|
| 1 | Claude Sonnet 5 | Types, habit logic, elapsed, status/roll, calendar series, Firestore writes |
| 2 | Gemini 3.8 Flash | Pages, nav, graphs, chooser, forms, recap, pill, focus overlay, inbox scroll, motion |

Pass 2 consumes the contract in the SRS. It does not invent writes.

## 10. References

- Locked design conversation (2026-09-19)
- `docs/cadence-overhaul/SRS.md`
- `docs/cadence-overhaul/plan-backend.md`
- `docs/cadence-overhaul/plan-frontend.md`
- Habitify-style reference: list graphs, per-habit color, detail month calendar — not the Insights phone
