# Cadence

A premium productivity PWA that celebrates **starting tasks** over completing them.

## ✨ Features

### Tasks
- 📋 **Status Flow** - Default → Started → Paused → Done
- ⭐ **Priority System** - Star tasks to pin them to the top
- 🎉 **Confetti Celebration** - Celebrate when completing tasks
- 🔍 **Smart Filters** - All, Today, Upcoming, Unscheduled, Completed

### Calendar
- 📅 **Daily View** - 24-hour timeline (12 AM - 11 PM)
- 🖱️ **Drag & Drop** - Drag tasks from inbox to schedule them
- ⏱️ **Duration Editor** - Click events to adjust start/end times (15-min intervals)
- 🔄 **Bidirectional Sync** - Tasks ↔ Calendar events stay in sync

### Notes (Brain Dump)
- 📝 **Quick Capture** - Auto-saving notes
- 🎯 **Goals Tile** - Collapsible goals section with weekly/monthly/quarterly tracking

### Themes
- 🌙 **AMOLED Dark** - True black with vibrant accent colors
- ☀️ **Light Mode** - Clean, minimal interface

### PWA
- 📱 **Installable** - Add to home screen on mobile/desktop
- 🔔 **Offline Ready** - Works without internet

## Tech Stack

- **Framework**: Next.js 15 (React 19) with App Router
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit/core
- **State**: Zustand (optimistic updates)
- **Database**: Firebase Firestore (real-time sync)
- **Auth**: Firebase Auth (Google Sign-In)

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   - Copy `.env.local.example` to `.env.local`
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore and Authentication (Google provider)
   - Add your Firebase config keys to `.env.local`

3. **Create Firestore Indexes** (required for queries):
   - Go to Firebase Console → Firestore → Indexes
   - Create these composite indexes:

   | Collection | Fields |
   |------------|--------|
   | `tasks` | `userId` (Asc) + `order` (Asc) |
   | `notes` | `userId` (Asc) + `updatedAt` (Desc) |
   | `goals` | `userId` (Asc) + `endDate` (Asc) |

4. **Run the dev server**:
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

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

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Add your Vercel domain to Firebase Auth → Authorized domains

```bash
vercel --prod
```

## License

MIT
