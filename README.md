# Cadence

A process-focused productivity PWA that celebrates **starting tasks** over completing them.

## Features

- 📋 **Tasks** - Track tasks with status states (default → started → paused → done)
- 📅 **Calendar** - Drag-and-drop task scheduling with daily time blocks
- 📝 **Brain Dump** - Quick capture notes with auto-save and convert-to-task
- 🎯 **Goals** - Weekly/monthly goals with progress tracking
- 🔄 **Bidirectional Sync** - Tasks ↔ Calendar events stay in sync
- 📱 **PWA** - Works offline, installable on mobile/desktop
- 🌙 **Dark Mode** - System theme support

## Tech Stack

- **Framework**: Next.js 15 (React 19) with App Router
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit/core
- **State**: Zustand
- **Database**: Firebase Firestore (real-time sync)
- **Auth**: Firebase Auth (Google + Email)

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   - Copy `.env.local.example` to `.env.local`
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore and Authentication (Google + Email providers)
   - Add your Firebase config keys to `.env.local`

3. **Run the dev server**:
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## Firebase Setup

### Firestore Security Rules
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

### Firestore Indexes
Create these composite indexes in Firebase Console:
- `tasks`: userId (asc) + status (asc)
- `tasks`: userId (asc) + order (asc)
- `calendar_events`: userId (asc) + date (asc) + startTime (asc)
- `notes`: userId (asc) + updatedAt (desc)
- `goals`: userId (asc) + endDate (desc)

## Deployment

Deploy to Vercel:
```bash
vercel --prod
```

Add environment variables in Vercel dashboard.
