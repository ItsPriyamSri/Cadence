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
    } as Task;
}

export function docToCalendarEvent(doc: DocumentData): CalendarEvent {
    return {
        id: doc.id,
        ...doc.data(),
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
