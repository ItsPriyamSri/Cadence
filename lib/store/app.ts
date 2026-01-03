'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'amoled';
type TaskFilter = 'all' | 'today' | 'upcoming' | 'unscheduled' | 'completed';

interface AppState {
    // Theme
    theme: Theme;
    setTheme: (theme: Theme) => void;

    // Task filtering
    taskFilter: TaskFilter;
    setTaskFilter: (filter: TaskFilter) => void;

    // Mobile navigation
    activeTab: 'tasks' | 'notes' | 'calendar';
    setActiveTab: (tab: 'tasks' | 'notes' | 'calendar') => void;

    // Modal states
    isTaskFormOpen: boolean;
    editingTaskId: string | null;
    openTaskForm: (taskId?: string) => void;
    closeTaskForm: () => void;

    isGoalModalOpen: boolean;
    editingGoalId: string | null;
    openGoalModal: (goalId?: string) => void;
    closeGoalModal: () => void;

    isStatusModalOpen: boolean;
    statusModalTaskId: string | null;
    openStatusModal: (taskId: string) => void;
    closeStatusModal: () => void;

    // Task context menu
    contextMenuTaskId: string | null;
    openContextMenu: (taskId: string) => void;
    closeContextMenu: () => void;

    // Goals expanded state on notes page
    isGoalsExpanded: boolean;
    toggleGoalsExpanded: () => void;

    // Selected date for calendar
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;

    // Celebration state
    showConfetti: boolean;
    triggerConfetti: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Theme - persisted
            theme: 'amoled',
            setTheme: (theme) => {
                // Apply theme class to document
                if (typeof document !== 'undefined') {
                    document.documentElement.classList.remove('light', 'dark', 'amoled');
                    document.documentElement.classList.add(theme);
                }
                set({ theme });
            },

            // Task filtering
            taskFilter: 'all',
            setTaskFilter: (taskFilter) => set({ taskFilter }),

            // Mobile navigation
            activeTab: 'tasks',
            setActiveTab: (activeTab) => set({ activeTab }),

            // Task form modal
            isTaskFormOpen: false,
            editingTaskId: null,
            openTaskForm: (taskId) => set({
                isTaskFormOpen: true,
                editingTaskId: taskId || null
            }),
            closeTaskForm: () => set({
                isTaskFormOpen: false,
                editingTaskId: null
            }),

            // Goal modal
            isGoalModalOpen: false,
            editingGoalId: null,
            openGoalModal: (goalId) => set({
                isGoalModalOpen: true,
                editingGoalId: goalId || null
            }),
            closeGoalModal: () => set({
                isGoalModalOpen: false,
                editingGoalId: null
            }),

            // Status change modal
            isStatusModalOpen: false,
            statusModalTaskId: null,
            openStatusModal: (taskId) => set({
                isStatusModalOpen: true,
                statusModalTaskId: taskId
            }),
            closeStatusModal: () => set({
                isStatusModalOpen: false,
                statusModalTaskId: null
            }),

            // Context menu
            contextMenuTaskId: null,
            openContextMenu: (taskId) => set({ contextMenuTaskId: taskId }),
            closeContextMenu: () => set({ contextMenuTaskId: null }),

            // Goals expanded
            isGoalsExpanded: false,
            toggleGoalsExpanded: () => set((state) => ({
                isGoalsExpanded: !state.isGoalsExpanded
            })),

            // Calendar selected date
            selectedDate: new Date(),
            setSelectedDate: (selectedDate) => set({ selectedDate }),

            // Confetti
            showConfetti: false,
            triggerConfetti: () => {
                set({ showConfetti: true });
                setTimeout(() => set({ showConfetti: false }), 3000);
            },
        }),
        {
            name: 'cadence-settings',
            partialize: (state) => ({
                theme: state.theme,
                taskFilter: state.taskFilter,
            }),
        }
    )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('cadence-settings');
    if (stored) {
        try {
            const { state } = JSON.parse(stored);
            if (state?.theme) {
                document.documentElement.classList.add(state.theme);
            }
        } catch (e) {
            document.documentElement.classList.add('amoled');
        }
    } else {
        document.documentElement.classList.add('amoled');
    }
}
