'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronRight } from 'lucide-react';
import { useActiveTasks } from '@/lib/hooks/useTasks';
import { useAppStore } from '@/lib/store/app';
import { useDisplayedElapsed } from '@/components/focus/useDisplayedElapsed';
import { formatElapsed } from '@/lib/utils/dates';

export function ActiveTaskBanner() {
    const { activeTasks } = useActiveTasks();
    const { openFocus } = useAppStore();
    const activeTask = activeTasks[0];
    const seconds = useDisplayedElapsed(activeTask);

    if (!activeTask) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 rounded-lg bg-bg-primary border border-border shadow-elev-2 overflow-hidden"
        >
            <button
                type="button"
                onClick={openFocus}
                aria-label="Open focus timer"
                className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-bg-secondary/50 transition-colors"
            >
                <span className="relative w-[38px] h-[38px] shrink-0 flex items-center justify-center rounded-full bg-started-bg text-started">
                    <span
                        className="absolute inset-0 rounded-full animate-cad-glow"
                        style={{ boxShadow: '0 0 0 3px var(--started-bg), 0 0 12px var(--started)' }}
                    />
                    <Play className="relative w-[17px] h-[17px]" fill="currentColor" strokeWidth={0} />
                </span>

                <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold tracking-[0.04em] uppercase text-started">
                        In progress
                    </div>
                    <div className="text-sm font-semibold text-text-primary truncate">
                        {activeTask.title}
                    </div>
                </div>

                <span className="font-mono font-bold text-sm text-started tabular-nums shrink-0">
                    {formatElapsed(seconds)}
                </span>

                <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
            </button>
        </motion.div>
    );
}
