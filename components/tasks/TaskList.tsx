'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, ChevronDown } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TaskFilters } from './TaskFilters';
import { Button } from '@/components/ui/Button';
import { useTasks } from '@/lib/hooks/useTasks';
import { useAppStore } from '@/lib/store/app';
import { staggerContainer, fadeIn } from '@/lib/utils/animations';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

export function TaskList() {
    const { tasks, loading } = useTasks();
    const { openTaskForm, taskFilter } = useAppStore();
    const [showPastCompleted, setShowPastCompleted] = React.useState(false);

    // Filter and sort tasks
    const filteredTasks = useMemo(() => {
        const today = format(new Date(), 'yyyy-MM-dd');

        let filtered = [...tasks];

        switch (taskFilter) {
            case 'today':
                filtered = tasks.filter((t) =>
                    t.calendarSlot?.date === today && t.status !== 'done'
                );
                break;
            case 'upcoming':
                filtered = tasks.filter((t) =>
                    t.calendarSlot?.date && t.calendarSlot.date > today && t.status !== 'done'
                );
                break;
            case 'unscheduled':
                filtered = tasks.filter((t) =>
                    !t.calendarSlot && t.status !== 'done'
                );
                break;
            case 'completed':
                filtered = tasks.filter((t) => t.status === 'done');
                break;
            default:
                // Show all non-done tasks
                filtered = tasks.filter((t) => t.status !== 'done');
        }

        // Sort: priority first, then started, paused, default
        // Memoize the sort function for stability
        const statusOrder = { started: 0, paused: 1, default: 2, done: 3 };
        return filtered.sort((a, b) => {
            // Priority first
            if (a.priority && !b.priority) return -1;
            if (!a.priority && b.priority) return 1;
            // Then by status
            const orderDiff = statusOrder[a.status] - statusOrder[b.status];
            if (orderDiff !== 0) return orderDiff;
            // Then by order
            return a.order - b.order;
        });
    }, [tasks, taskFilter]);

    // Separate today's completed from past completed
    const { todayCompleted, pastCompleted } = useMemo(() => {
        if (taskFilter !== 'completed') return { todayCompleted: [], pastCompleted: [] };

        const today = format(new Date(), 'yyyy-MM-dd');
        const todayC = filteredTasks.filter((t) => {
            if (!t.completedAt) return true;
            const completedDate = t.completedAt.toDate ? format(t.completedAt.toDate(), 'yyyy-MM-dd') : today;
            return completedDate === today;
        });
        const pastC = filteredTasks.filter((t) => {
            if (!t.completedAt) return false;
            const completedDate = t.completedAt.toDate ? format(t.completedAt.toDate(), 'yyyy-MM-dd') : '';
            return completedDate !== today && completedDate !== '';
        });
        return { todayCompleted: todayC, pastCompleted: pastC };
    }, [filteredTasks, taskFilter]);

    const startedCount = tasks.filter(t => t.status === 'started').length;

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
            >
                <div className="w-12 h-12 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
                <p className="text-sm text-text-secondary">Loading tasks...</p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters with better spacing */}
            <div className="sticky top-14 z-30 bg-bg-primary/95 backdrop-blur-xl py-2 -mx-4 px-4 border-b border-border/50">
                <TaskFilters />
            </div>

            {/* Add Task Button - Enhanced */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Button
                    onClick={() => openTaskForm()}
                    variant="outline"
                    className={cn(
                        'w-full justify-center border-dashed border-2 py-6 rounded-2xl',
                        'hover:border-accent hover:bg-accent/5 transition-all duration-300',
                        'group'
                    )}
                >
                    <div className="flex items-center gap-2 text-text-secondary group-hover:text-accent font-medium">
                        <div className="p-1 rounded-full bg-bg-secondary group-hover:bg-accent/20 transition-colors">
                            <Plus className="w-4 h-4" />
                        </div>
                        Create New Task
                    </div>
                </Button>
            </motion.div>

            {tasks.length === 0 ? (
                <motion.div
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="text-center py-20"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-accent/20 to-blue-500/20 flex items-center justify-center shadow-inner">
                        <Plus className="w-10 h-10 text-accent" />
                    </div>
                    <p className="text-xl font-semibold text-text-primary mb-2">No tasks yet</p>
                    <p className="text-text-secondary">Create your first task to get started</p>
                </motion.div>
            ) : filteredTasks.length === 0 ? (
                <motion.div
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="text-center py-12"
                >
                    <p className="text-text-secondary">No tasks match this filter</p>
                </motion.div>
            ) : (
                <>
                    {/* Active task indicator */}
                    <AnimatePresence>
                        {startedCount > 0 && taskFilter === 'all' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                className="px-4 py-3 bg-gradient-to-r from-[#06d6a0]/20 to-[#00b894]/10 rounded-2xl border border-[#06d6a0]/30 shadow-sm"
                            >
                                <p className="text-sm font-semibold text-[#06d6a0] flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06d6a0] opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#06d6a0]"></span>
                                    </span>
                                    {startedCount} task{startedCount > 1 ? 's' : ''} in progress
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Task List - improved layout animation */}
                    {taskFilter !== 'completed' ? (
                        <motion.div
                            layout
                            className="space-y-3"
                        >
                            <AnimatePresence mode="popLayout" initial={false}>
                                {filteredTasks.map((task) => (
                                    <TaskCard key={task.id} task={task} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <>
                            {/* Today's Completed */}
                            {todayCompleted.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle2 className="w-5 h-5 text-[#06d6a0]" />
                                        <h3 className="text-base font-semibold text-text-primary">
                                            Completed Today <span className="text-text-secondary font-normal">({todayCompleted.length})</span>
                                        </h3>
                                    </div>
                                    <motion.div
                                        className="space-y-3"
                                    >
                                        <AnimatePresence mode="popLayout" initial={false}>
                                            {todayCompleted.map((task) => (
                                                <TaskCard key={task.id} task={task} />
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                            )}

                            {/* Past Completed (Collapsed) */}
                            {pastCompleted.length > 0 && (
                                <div className="pt-6 border-t border-border/50">
                                    <button
                                        onClick={() => setShowPastCompleted(!showPastCompleted)}
                                        className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors p-2 hover:bg-bg-secondary rounded-lg"
                                    >
                                        <ChevronDown className={cn(
                                            'w-4 h-4 transition-transform duration-300',
                                            showPastCompleted && 'rotate-180'
                                        )} />
                                        <span>Past Completed ({pastCompleted.length})</span>
                                    </button>

                                    <AnimatePresence>
                                        {showPastCompleted && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 space-y-3"
                                            >
                                                {pastCompleted.map((task) => (
                                                    <TaskCard key={task.id} task={task} />
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
