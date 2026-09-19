'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, RotateCcw, Check, Search } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TaskFilters } from './TaskFilters';
import { TodayRecap } from './TodayRecap';
import { FocusPill } from '@/components/focus/FocusPill';
import { CadenceLoader } from '@/components/ui/CadenceLoader';
import { useTasks } from '@/lib/hooks/useTasks';
import { useAppStore } from '@/lib/store/app';
import { updateTaskStatus } from '@/lib/actions/tasks';
import { formatDateKey } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';
import { Task } from '@/lib/firebase/firestore';

export function TaskList() {
    const { tasks, loading } = useTasks();
    const { openTaskForm, taskFilter } = useAppStore();
    const [pastOpen, setPastOpen] = React.useState(false);

    const filteredTasks = useMemo(() => {
        const today = formatDateKey(new Date());
        let filtered: Task[] = [];

        switch (taskFilter) {
            case 'today':
                filtered = tasks.filter((t) => {
                    if (t.status === 'done') return false;
                    if (t.repeat !== null) {
                        return t.dueDate !== null && t.dueDate <= today;
                    }
                    return t.calendarSlot?.date === today;
                });
                break;
            case 'upcoming':
                filtered = tasks.filter((t) => {
                    if (t.status === 'done') return false;
                    if (t.repeat !== null) {
                        return t.dueDate !== null && t.dueDate > today;
                    }
                    return !!(t.calendarSlot?.date && t.calendarSlot.date > today);
                });
                break;
            case 'unscheduled':
                filtered = tasks.filter((t) => {
                    if (t.status === 'done' || t.calendarSlot) return false;
                    if (t.repeat !== null && t.dueDate !== null && t.dueDate > today) return false;
                    return true;
                });
                break;
            case 'completed':
                filtered = tasks.filter((t) => t.repeat === null && t.status === 'done');
                break;
            default:
                // 'all': not done, excluding habits with dueDate > today
                filtered = tasks.filter((t) => {
                    if (t.status === 'done') return false;
                    if (t.repeat !== null && t.dueDate !== null && t.dueDate > today) return false;
                    return true;
                });
        }

        const statusOrder = { started: 0, paused: 1, default: 2, done: 3 };
        return filtered.sort((a, b) => {
            if (a.priority && !b.priority) return -1;
            if (!a.priority && b.priority) return 1;
            const orderDiff = statusOrder[a.status] - statusOrder[b.status];
            if (orderDiff !== 0) return orderDiff;
            return a.order - b.order;
        });
    }, [tasks, taskFilter]);

    const { todayCompleted, pastCompleted } = useMemo(() => {
        if (taskFilter !== 'completed') return { todayCompleted: [] as Task[], pastCompleted: [] as Task[] };
        const today = formatDateKey(new Date());
        const todayC = filteredTasks.filter((t) => {
            if (!t.completedAt) return true;
            const d = t.completedAt.toDate ? formatDateKey(t.completedAt.toDate()) : today;
            return d === today;
        });
        const pastC = filteredTasks.filter((t) => {
            if (!t.completedAt) return false;
            const d = t.completedAt.toDate ? formatDateKey(t.completedAt.toDate()) : '';
            return d !== today && d !== '';
        });
        return { todayCompleted: todayC, pastCompleted: pastC };
    }, [filteredTasks, taskFilter]);

    const startedCount = tasks.filter((t) => t.status === 'started').length;

    return (
        <div className="space-y-4">
            <TaskFilters />

            {/* In-progress focus pill */}
            <FocusPill />

            {loading ? (
                <CadenceLoader label="Loading tasks" className="py-20" />
            ) : tasks.length === 0 ? (
                <EmptyCreate onCreate={() => openTaskForm()} />
            ) : filteredTasks.length === 0 ? (
                <EmptyFilter />
            ) : taskFilter === 'completed' ? (
                <div className="space-y-4">
                    {todayCompleted.length > 0 && (
                        <div>
                            <div className="text-xs font-bold tracking-[0.06em] uppercase text-text-tertiary mx-1 mb-2.5">Completed Today</div>
                            <div className="space-y-2.5">
                                {todayCompleted.map((t) => <CompletedRow key={t.id} task={t} />)}
                            </div>
                        </div>
                    )}
                    {pastCompleted.length > 0 && (
                        <div>
                            <button
                                onClick={() => setPastOpen((o) => !o)}
                                className="flex items-center gap-2 w-full mt-2 py-3 text-xs font-bold tracking-[0.04em] uppercase text-text-secondary"
                            >
                                <ChevronRight className={cn('w-4 h-4 transition-transform', pastOpen && 'rotate-90')} />
                                Past Completed ({pastCompleted.length})
                            </button>
                            <AnimatePresence>
                                {pastOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2.5 overflow-hidden"
                                    >
                                        {pastCompleted.map((t) => <CompletedRow key={t.id} task={t} />)}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            ) : (
                <motion.div layout className="space-y-2.5">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Live Today Recap */}
            <TodayRecap tasks={tasks} />
        </div>
    );
}

function CompletedRow({ task }: { task: Task }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-bg-primary border border-border shadow-elev-1 opacity-70">
            <span className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-done-bg text-done">
                <Check className="w-4 h-4" strokeWidth={2.6} />
            </span>
            <span className="flex-1 min-w-0 text-base font-semibold text-text-secondary line-through truncate">{task.title}</span>
            <button
                onClick={() => updateTaskStatus(task.id, 'default')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-border bg-bg-primary text-text-secondary text-sm font-semibold hover:bg-bg-secondary hover:text-text-primary transition-colors"
            >
                <RotateCcw className="w-4 h-4" /> Restore
            </button>
        </div>
    );
}

function EmptyCreate({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="flex flex-col items-center text-center gap-2 py-14 px-6">
            <div className="w-[76px] h-[76px] rounded-4xl bg-accent-subtle flex items-center justify-center mb-1.5">
                <Check className="w-9 h-9 text-accent" strokeWidth={1.8} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">No tasks yet</h2>
            <p className="text-base text-text-secondary max-w-[280px]">Every big thing starts with a first step. Create your first task and get some momentum.</p>
            <button
                onClick={onCreate}
                className="mt-2.5 flex items-center gap-2 px-5 py-3 rounded-md bg-accent text-on-accent text-base font-semibold shadow-[0_6px_18px_var(--accent-glow)] hover:brightness-105 transition"
            >
                <Plus className="w-[18px] h-[18px]" strokeWidth={2.4} /> Create your first task
            </button>
        </div>
    );
}

function EmptyFilter() {
    return (
        <div className="flex flex-col items-center text-center gap-2 py-14 px-6">
            <div className="w-[68px] h-[68px] rounded-4xl bg-bg-secondary flex items-center justify-center mb-1">
                <Search className="w-[30px] h-[30px] text-text-tertiary" strokeWidth={1.8} />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Nothing here</h2>
            <p className="text-base text-text-secondary">No tasks match this filter.</p>
        </div>
    );
}
