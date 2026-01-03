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
import { format, isToday, isFuture, parseISO } from 'date-fns';

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
            if (!t.completedAt) return true; // Recently completed, show in today
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
        <div className="space-y-4">
            {/* Filters */}
            <TaskFilters />

            {/* Add Task Button */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Button
                    onClick={() => openTaskForm()}
                    variant="outline"
                    className={cn(
                        'w-full justify-center border-dashed border-2',
                        'hover:border-accent hover:bg-accent/5',
                        'amoled:hover:border-[#3a86ff] amoled:hover:bg-[#3a86ff]/10'
                    )}
                    icon={<Plus className="w-4 h-4" />}
                >
                    Add Task
                </Button>
            </motion.div>

            {tasks.length === 0 ? (
                <motion.div
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    className="text-center py-16"
                >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent/20 to-[#8338ec]/20 flex items-center justify-center">
                        <Plus className="w-8 h-8 text-accent" />
                    </div>
                    <p className="text-text-primary font-medium mb-1">No tasks yet</p>
                    <p className="text-sm text-text-secondary">Create your first task to get started</p>
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
                    {startedCount > 0 && taskFilter === 'all' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="px-3 py-2 bg-gradient-to-r from-[#06d6a0]/20 to-[#00b894]/10 rounded-xl border border-[#06d6a0]/30"
                        >
                            <p className="text-sm font-medium text-[#06d6a0]">
                                🎯 {startedCount} task{startedCount > 1 ? 's' : ''} in progress
                            </p>
                        </motion.div>
                    )}

                    {/* Task List */}
                    {taskFilter !== 'completed' ? (
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="space-y-3"
                        >
                            <AnimatePresence mode="popLayout">
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
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle2 className="w-4 h-4 text-[#06d6a0]" />
                                        <h3 className="text-sm font-medium text-text-secondary">
                                            Completed Today ({todayCompleted.length})
                                        </h3>
                                    </div>
                                    <motion.div
                                        variants={staggerContainer}
                                        initial="hidden"
                                        animate="visible"
                                        className="space-y-2"
                                    >
                                        <AnimatePresence mode="popLayout">
                                            {todayCompleted.map((task) => (
                                                <TaskCard key={task.id} task={task} />
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                            )}

                            {/* Past Completed (Collapsed) */}
                            {pastCompleted.length > 0 && (
                                <div className="pt-4">
                                    <button
                                        onClick={() => setShowPastCompleted(!showPastCompleted)}
                                        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        <ChevronDown className={cn(
                                            'w-4 h-4 transition-transform',
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
                                                className="mt-2 space-y-2"
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
