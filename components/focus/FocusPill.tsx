'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useActiveTasks } from '@/lib/hooks/useTasks';
import { useAppStore } from '@/lib/store/app';
import { useDisplayedElapsed } from './useDisplayedElapsed';
import { formatElapsed } from '@/lib/utils/dates';

export function FocusPill() {
    const { activeTasks } = useActiveTasks();
    const { openFocus } = useAppStore();
    const activeTask = activeTasks[0];
    const seconds = useDisplayedElapsed(activeTask);

    if (!activeTask) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            onClick={openFocus}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFocus();
                }
            }}
            aria-label="Open focus timer"
            className="flex items-center gap-3 px-4 py-3 rounded-md bg-started-bg border border-[color-mix(in_srgb,var(--started)_30%,transparent)] cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all"
        >
            <span className="w-2.5 h-2.5 rounded-full bg-started shadow-[0_0_8px_var(--started)] animate-cad-live shrink-0" />
            <span className="text-sm font-semibold text-text-primary truncate flex-1 min-w-0">
                {activeTask.title}
            </span>
            <span className="font-mono font-bold text-sm text-started tabular-nums shrink-0">
                {formatElapsed(seconds)}
            </span>
            <ChevronRight className="w-4 h-4 text-started shrink-0" />
        </motion.div>
    );
}
