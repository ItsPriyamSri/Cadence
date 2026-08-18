'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Target, Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store/app';
import { useGoals } from '@/lib/hooks/useGoals';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

const typeBadge: Record<string, string> = {
    weekly: 'bg-accent-subtle text-accent',
    monthly: 'bg-priority-bg text-priority',
    quarterly: 'bg-started-bg text-started',
};

export function GoalsTile() {
    const { isGoalsExpanded, toggleGoalsExpanded, openGoalModal } = useAppStore();
    const { goals, loading } = useGoals();

    const activeGoals = goals.filter((g) => {
        const endDate = g.endDate?.toDate?.() || new Date(g.endDate as any);
        return endDate >= new Date();
    });

    return (
        <div className="rounded-lg overflow-hidden border border-border shadow-elev-1">
            <button
                onClick={toggleGoalsExpanded}
                className="flex items-center gap-3 w-full p-4 text-left bg-accent text-on-accent"
            >
                <span className="w-[38px] h-[38px] shrink-0 flex items-center justify-center rounded-xl bg-on-accent/15">
                    <Target className="w-5 h-5" />
                </span>
                <div className="flex-1">
                    <div className="text-base font-bold tracking-tight">Goals</div>
                    <div className="text-sm opacity-90">
                        {loading ? 'Loading…' : `${activeGoals.length} active goal${activeGoals.length !== 1 ? 's' : ''}`}
                    </div>
                </div>
                <motion.span animate={{ rotate: isGoalsExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-5 h-5" strokeWidth={2.2} />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {isGoalsExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-bg-primary"
                    >
                        <div className="p-3 flex flex-col gap-2.5">
                            {activeGoals.map((goal) => {
                                const pct = Math.round(goal.progress ?? 0);
                                return (
                                    <button
                                        key={goal.id}
                                        onClick={() => openGoalModal(goal.id)}
                                        className="flex flex-col gap-2 w-full p-3.5 rounded-md border border-border bg-bg-secondary text-left hover:bg-bg-tertiary transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-semibold text-text-primary">{goal.title}</span>
                                            <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-md', typeBadge[goal.type])}>
                                                {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
                                            </span>
                                            <span className="ml-auto text-xs text-text-tertiary">
                                                {goal.endDate?.toDate ? format(goal.endDate.toDate(), 'MMM d') : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex-1 h-[7px] rounded-full bg-bg-tertiary overflow-hidden">
                                                <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-text-secondary tabular-nums">{pct}%</span>
                                        </div>
                                    </button>
                                );
                            })}

                            {activeGoals.length === 0 && !loading && (
                                <p className="text-center text-sm text-text-tertiary py-2">
                                    No active goals. Create one to stay focused!
                                </p>
                            )}

                            <button
                                onClick={() => openGoalModal()}
                                className="flex items-center justify-center gap-2 w-full p-3 rounded-md border-[1.5px] border-dashed border-border-strong bg-transparent text-accent text-sm font-semibold hover:bg-accent-subtle transition-colors"
                            >
                                <Plus className="w-4 h-4" strokeWidth={2.4} /> Add Goal
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
