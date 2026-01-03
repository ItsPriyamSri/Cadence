'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ListFilter } from 'lucide-react';
import { useAppStore } from '@/lib/store/app';
import { cn } from '@/lib/utils/cn';

type FilterOption = 'all' | 'today' | 'upcoming' | 'unscheduled' | 'completed';

const filters: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'unscheduled', label: 'Unscheduled' },
    { value: 'completed', label: 'Done' },
];

export function TaskFilters() {
    const { taskFilter, setTaskFilter } = useAppStore();

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <ListFilter className="w-4 h-4 text-text-secondary flex-shrink-0" />
            {filters.map((filter) => (
                <motion.button
                    key={filter.value}
                    onClick={() => setTaskFilter(filter.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                        taskFilter === filter.value
                            ? 'bg-accent text-white shadow-md'
                            : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                    )}
                >
                    {filter.label}
                </motion.button>
            ))}
        </div>
    );
}
