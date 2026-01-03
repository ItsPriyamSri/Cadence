'use client';

import { create } from 'zustand';
import { Task, CalendarEvent, Note, Goal, Timestamp } from '@/lib/firebase/firestore';

// Optimistic update stores for instant UI feedback
// These stores update immediately, then sync with Firestore in background

interface TasksStore {
    tasks: Task[];
    loading: boolean;
    setTasks: (tasks: Task[]) => void;
    setLoading: (loading: boolean) => void;

    // Optimistic operations
    addTask: (task: Task) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    removeTask: (taskId: string) => void;
}

export const useTasksStore = create<TasksStore>((set) => ({
    tasks: [],
    loading: true,
    setTasks: (tasks) => set({ tasks, loading: false }),
    setLoading: (loading) => set({ loading }),

    addTask: (task) => set((state) => ({
        tasks: [task, ...state.tasks].sort((a, b) => a.order - b.order),
    })),

    updateTask: (taskId, updates) => set((state) => ({
        tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
        ),
    })),

    removeTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
    })),
}));

interface NotesStore {
    notes: Note[];
    loading: boolean;
    setNotes: (notes: Note[]) => void;
    setLoading: (loading: boolean) => void;

    addNote: (note: Note) => void;
    updateNote: (noteId: string, updates: Partial<Note>) => void;
    removeNote: (noteId: string) => void;
}

export const useNotesStore = create<NotesStore>((set) => ({
    notes: [],
    loading: true,
    setNotes: (notes) => set({ notes, loading: false }),
    setLoading: (loading) => set({ loading }),

    addNote: (note) => set((state) => ({
        notes: [note, ...state.notes],
    })),

    updateNote: (noteId, updates) => set((state) => ({
        notes: state.notes.map((n) =>
            n.id === noteId ? { ...n, ...updates } : n
        ),
    })),

    removeNote: (noteId) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== noteId),
    })),
}));

interface GoalsStore {
    goals: Goal[];
    loading: boolean;
    setGoals: (goals: Goal[]) => void;
    setLoading: (loading: boolean) => void;

    addGoal: (goal: Goal) => void;
    updateGoal: (goalId: string, updates: Partial<Goal>) => void;
    removeGoal: (goalId: string) => void;
}

export const useGoalsStore = create<GoalsStore>((set) => ({
    goals: [],
    loading: true,
    setGoals: (goals) => set({ goals, loading: false }),
    setLoading: (loading) => set({ loading }),

    addGoal: (goal) => set((state) => ({
        goals: [goal, ...state.goals],
    })),

    updateGoal: (goalId, updates) => set((state) => ({
        goals: state.goals.map((g) =>
            g.id === goalId ? { ...g, ...updates } : g
        ),
    })),

    removeGoal: (goalId) => set((state) => ({
        goals: state.goals.filter((g) => g.id !== goalId),
    })),
}));

interface CalendarStore {
    events: CalendarEvent[];
    loading: boolean;
    setEvents: (events: CalendarEvent[]) => void;
    setLoading: (loading: boolean) => void;

    addEvent: (event: CalendarEvent) => void;
    updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
    removeEvent: (eventId: string) => void;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
    events: [],
    loading: true,
    setEvents: (events) => set({ events, loading: false }),
    setLoading: (loading) => set({ loading }),

    addEvent: (event) => set((state) => ({
        events: [...state.events, event].sort((a, b) =>
            a.startTime.localeCompare(b.startTime)
        ),
    })),

    updateEvent: (eventId, updates) => set((state) => ({
        events: state.events.map((e) =>
            e.id === eventId ? { ...e, ...updates } : e
        ),
    })),

    removeEvent: (eventId) => set((state) => ({
        events: state.events.filter((e) => e.id !== eventId),
    })),
}));
