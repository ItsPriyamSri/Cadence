'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatDateKey } from '@/lib/utils/dates';
import { useAppStore } from '@/lib/store/app';
import { useTasks } from '@/lib/hooks/useTasks';
import { cn } from '@/lib/utils/cn';

type FilterOption = 'all' | 'today' | 'upcoming' | 'unscheduled' | 'completed';

const filters: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'unscheduled', label: 'Inbox' },
    { value: 'completed', label: 'Done' },
];

export function TaskFilters() {
    const { taskFilter, setTaskFilter } = useAppStore();
    const { tasks } = useTasks();

    const counts = useMemo(() => {
        const today = formatDateKey(new Date());

        return {
            all: tasks.filter((t) => {
                if (t.status === 'done') return false;
                if (t.repeat !== null && t.dueDate !== null && t.dueDate > today) return false;
                return true;
            }).length,

            today: tasks.filter((t) => {
                if (t.status === 'done') return false;
                if (t.repeat !== null) {
                    return t.dueDate !== null && t.dueDate <= today;
                }
                return t.calendarSlot?.date === today;
            }).length,

            upcoming: tasks.filter((t) => {
                if (t.status === 'done') return false;
                if (t.repeat !== null) {
                    return t.dueDate !== null && t.dueDate > today;
                }
                return !!(t.calendarSlot?.date && t.calendarSlot.date > today);
            }).length,

            unscheduled: tasks.filter((t) => {
                if (t.status === 'done' || t.calendarSlot) return false;
                if (t.repeat !== null && t.dueDate !== null && t.dueDate > today) return false;
                return true;
            }).length,

            completed: tasks.filter((t) => t.repeat === null && t.status === 'done').length,
        } as Record<FilterOption, number>;
    }, [tasks]);

    return (
        <div className="scrollbar-hide relative flex gap-1.5 overflow-x-auto p-1.5 bg-bg-secondary border border-border rounded-lg">
            {filters.map((filter) => {
                const isActive = taskFilter === filter.value;
                const count = counts[filter.value];
                return (
                    <button
                        key={filter.value}
                        onClick={() => setTaskFilter(filter.value)}
                        className={cn(
                            'relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors',
                            isActive ? 'text-on-accent' : 'text-text-secondary hover:text-text-primary'
                        )}
                    >
                        {isActive && (
                            <motion.span
                                layoutId="taskFilterPill"
                                className="absolute inset-0 rounded-md bg-accent shadow-[0_4px_12px_var(--accent-glow)]"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                        )}
                        <span className="relative z-10">{filter.label}</span>
                        {count > 0 && (
                            <span
                                className={cn(
                                    'relative z-10 min-w-[18px] px-1.5 rounded-full text-[11px] font-bold text-center',
                                    isActive ? 'bg-white/20 text-on-accent' : 'bg-bg-tertiary text-text-tertiary'
                                )}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
