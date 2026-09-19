import {
    collection,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    serverTimestamp,
    writeBatch,
    runTransaction,
    Timestamp,
    DocumentData,
    QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// Collection references
export const collections = {
    users: 'users',
    tasks: 'tasks',
    calendarEvents: 'calendar_events',
    notes: 'notes',
    goals: 'goals',
} as const;

// Habit types (Cadence overhaul — habit = repeating task, no new collections)
export type RepeatRule =
    | { kind: 'daily' }
    | { kind: 'everyN'; n: number } // n >= 2
    | { kind: 'weekdays'; days: number[] }; // Date.getDay(): 0 Sun … 6 Sat, unique, length >= 1

export type CheckInLevel = 1 | 2; // 1 light, 2 dark

export interface LockedTime {
    startTime: string; // 'HH:mm'
    endTime: string; // 'HH:mm'
}

// Type definitions
export interface Task {
    id: string;
    userId: string;
    title: string;
    status: 'default' | 'started' | 'paused' | 'done';
    createdAt: Timestamp;
    startedAt: Timestamp | null;
    pausedAt: Timestamp | null;
    completedAt: Timestamp | null;
    goalId: string | null;
    calendarSlot: {
        date: string;
        startTime: string;
        endTime: string;
        eventId: string;
    } | null;
    order: number;
    priority: boolean; // NEW: priority flag
    // Habit fields (repeat !== null means this task is a habit)
    repeat: RepeatRule | null;
    habitStartedOn: string | null; // yyyy-MM-dd when repeat was first turned on
    color: string | null; // hex from HABIT_PALETTE
    sameTimeWeekly: boolean; // project this week's due days onto the calendar
    lockedTime: LockedTime | null; // clock used by the weekly series
    checkIns: Record<string, CheckInLevel>; // date -> intensity; never wiped
    checkInElapsed: Record<string, number>; // date -> ms snapped on complete
    elapsedMs: number; // accumulated focus time for the current occurrence
    dueDate: string | null; // yyyy-MM-dd next/current due; null if one-off
}

export interface CalendarEvent {
    id: string;
    userId: string;
    taskId: string | null;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'active' | 'completed';
    color: string;
    boundWeekly: boolean; // member of a same-time weekly series
}

export interface Note {
    id: string;
    userId: string;
    content: string;
    priority: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Goal {
    id: string;
    userId: string;
    title: string;
    type: 'weekly' | 'monthly' | 'quarterly' | 'custom';
    startDate: Timestamp;
    endDate: Timestamp;
    createdAt: Timestamp;
    progress: number;
}

export interface UserProfile {
    name: string;
    email: string;
    theme: 'light' | 'dark' | 'amoled';
    calendarStartHour: number;
    calendarEndHour: number;
}

// Helper to convert Firestore doc to typed object
export function docToTask(doc: DocumentData): Task {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        priority: data.priority ?? false, // Default to false if not set
        repeat: data.repeat ?? null,
        habitStartedOn: data.habitStartedOn ?? null,
        color: data.color ?? null,
        sameTimeWeekly: data.sameTimeWeekly ?? false,
        lockedTime: data.lockedTime ?? null,
        checkIns: data.checkIns ?? {},
        checkInElapsed: data.checkInElapsed ?? {},
        elapsedMs: data.elapsedMs ?? 0,
        dueDate: data.dueDate ?? null,
    } as Task;
}

export function docToCalendarEvent(doc: DocumentData): CalendarEvent {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        boundWeekly: data.boundWeekly ?? false,
    } as CalendarEvent;
}

export function docToNote(doc: DocumentData): Note {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        priority: data.priority ?? false,
    } as Note;
}

export function docToGoal(doc: DocumentData): Goal {
    return {
        id: doc.id,
        ...doc.data(),
    } as Goal;
}

// Export Firestore utilities
export {
    collection,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    serverTimestamp,
    writeBatch,
    runTransaction,
    Timestamp,
    db,
};
