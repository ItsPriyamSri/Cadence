'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ListFilter, CalendarDays, Clock, Inbox, CheckCheck, Layers } from 'lucide-react';
import { useAppStore } from '@/lib/store/app';
import { cn } from '@/lib/utils/cn';

type FilterOption = 'all' | 'today' | 'upcoming' | 'unscheduled' | 'completed';

const filters: { value: FilterOption; label: string; icon: typeof Layers }[] = [
    { value: 'all', label: 'All', icon: Layers },
    { value: 'today', label: 'Today', icon: CalendarDays },
    { value: 'upcoming', label: 'Upcoming', icon: Clock },
    { value: 'unscheduled', label: 'Inbox', icon: Inbox },
    { value: 'completed', label: 'Done', icon: CheckCheck },
];

export function TaskFilters() {
    const { taskFilter, setTaskFilter } = useAppStore();

    return (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => {
                const Icon = filter.icon;
                const isActive = taskFilter === filter.value;

                return (
                    <motion.button
                        key={filter.value}
                        onClick={() => setTaskFilter(filter.value)}
                        layout
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            'relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300',
                            isActive
                                ? 'text-white'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                        )}
                    >
                        {/* Active background pill */}
                        {isActive && (
                            <motion.div
                                layoutId="activeFilterBg"
                                className="absolute inset-0 bg-gradient-to-r from-accent to-[#8338ec] rounded-xl shadow-lg"
                                initial={false}
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                        )}

                        <span className="relative z-10 flex items-center gap-2">
                            <Icon className={cn('w-4 h-4', isActive && 'drop-shadow-sm')} />
                            {filter.label}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
}
