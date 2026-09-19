# Cadence

Personal daily driver: capture in notes, plan on tasks, time-block on the calendar, come back for habits, stay with a focus clock.

A habit **is** a repeating task. Same title, same start / pause / done, same calendar block. Completing it from Tasks, Calendar, or Habits is one write.

PWA, mobile-first. Themes cycle light → dark → AMOLED.

## Surfaces

Nav: **Tasks · Calendar · Habits · Notes**

**Tasks.** Status is default → started → paused ↔ started. One-offs can be done. Habits roll instead: they never sit as done. Filters are Today, Upcoming, Inbox, All, and Done. Priority stars pin a task. The bottom of the page is a today recap (elapsed, habits + one-offs).

**Calendar.** Day timeline. Drag an unscheduled task onto a block (on a phone, swipe the inbox row and drag the grip). Completed habit blocks stay on today. Optional same-time weekly fills this week’s due days at a locked clock.

**Habits.** Every task with a repeat rule. Repeat is daily, every N days, or chosen weekdays. Each row has a 90-day contribution graph (3 × 30). Habits complete asks Partial or Full; Tasks/Calendar Done writes Full with no popup. Start writes Partial if today is empty. **Clear today** undoes today’s check-in. Detail has streaks, a month calendar, edit, and delete. Repeat Off turns it back into a one-off and keeps history.

**Notes (Brain Dump).** Autosaving notes and a collapsible goals tile (weekly / monthly / quarterly / custom). Goals are outcomes, not habits.

**Focus.** One live timer. Starting B pauses A. The Tasks pill shows title + elapsed; tap it for a full-page ring. Slide down or back to collapse. Not-started is `0:00`.

## Stack

Next.js 15 (App Router), React 19, Tailwind, Framer Motion, Zustand (optimistic), @dnd-kit, Firebase Auth + Firestore, `@ducanh2912/next-pwa`.

Collections: `tasks`, `calendar_events`, `notes`, `goals`, `users`. No reports collection.

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Create a Firebase project. Enable Firestore and Authentication (Google and/or email). Fill `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Composite indexes (Firestore → Indexes), matching the live queries:

| Collection | Fields |
|---|---|
| `tasks` | `userId` Asc, `order` Asc |
| `notes` | `userId` Asc, `updatedAt` Desc |
| `goals` | `userId` Asc, `createdAt` Desc |

`calendar_events` is `userId` only; no composite index.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Habit roll / streak / recap logic (no Firebase):

```bash
npx tsx lib/habits/logic.selfcheck.ts
```

## Firestore rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /tasks/{taskId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if request.auth != null;
    }

    match /calendar_events/{eventId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if request.auth != null;
    }

    match /notes/{noteId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if request.auth != null;
    }

    match /goals/{goalId} {
      allow read, write: if isOwner(resource.data.userId);
      allow create: if request.auth != null;
    }

    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## Deploy

Vercel: import the repo, add the same env vars, add the Vercel domain under Firebase Auth → Authorized domains.

```bash
vercel --prod
```

Locked product rules live in [`docs/cadence-overhaul/PRD.md`](docs/cadence-overhaul/PRD.md) and [`docs/cadence-overhaul/SRS.md`](docs/cadence-overhaul/SRS.md).

## License

MIT
