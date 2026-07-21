'use client';

import React, { useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { createTask, updateTask } from '@/lib/actions/tasks';
import { setTaskSchedule, addHour } from '@/lib/actions/calendar';
import { useActiveGoals } from '@/lib/hooks/useGoals';
import { Task } from '@/lib/firebase/firestore';
import { cn } from '@/lib/utils/cn';

interface TaskFormProps {
    initialTask?: Task | null;
    onClose: () => void;
}

const fieldClass =
    'w-full box-border px-3.5 py-3 rounded-md border-[1.5px] border-border bg-bg-secondary text-text-primary text-base font-[inherit] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-subtle)] focus:bg-bg-primary transition';

export function TaskForm({ initialTask, onClose }: TaskFormProps) {
    const [title, setTitle] = useState(initialTask?.title || '');
    const [goalId, setGoalId] = useState<string>(initialTask?.goalId || '');
    const [priority, setPriority] = useState<boolean>(initialTask?.priority ?? false);
    const [scheduled, setScheduled] = useState<boolean>(!!initialTask?.calendarSlot);
    const [date, setDate] = useState<string>(initialTask?.calendarSlot?.date || format(new Date(), 'yyyy-MM-dd'));
    const [time, setTime] = useState<string>(initialTask?.calendarSlot?.startTime || '09:00');
    const [loading, setLoading] = useState(false);
    const [titleError, setTitleError] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const { goals } = useActiveGoals();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) { setTitleError(true); return; }
        setLoading(true);
        setSubmitError('');
        try {
            let taskId: string;
            if (initialTask) {
                await updateTask(initialTask.id, { title: trimmed, goalId: goalId || null, priority });
                taskId = initialTask.id;
            } else {
                taskId = await createTask({ title: trimmed, goalId: goalId || null, priority });
            }

            const schedule = scheduled ? { date, startTime: time, endTime: addHour(time) } : null;
            await setTaskSchedule(taskId, trimmed, schedule);

            onClose();
        } catch (err) {
            console.error('Failed to save task:', err);
            setSubmitError('Could not save the task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-text-secondary">Task title</span>
                <input
                    autoFocus
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(false); }}
                    placeholder="What needs doing?"
                    className={cn(fieldClass, titleError && 'border-danger')}
                />
                {titleError && <span className="text-xs font-medium text-danger">A title is required.</span>}
            </label>

            {/* Schedule */}
            <div>
                <span className="text-xs font-semibold text-text-secondary">Schedule</span>
                <div className="flex gap-2 mt-1.5">
                    <button
                        type="button"
                        onClick={() => setScheduled(false)}
                        className={cn(
                            'flex-1 py-2.5 rounded-md border-[1.5px] text-sm font-semibold transition-colors',
                            !scheduled ? 'border-accent bg-accent-subtle text-accent' : 'border-border bg-bg-secondary text-text-secondary'
                        )}
                    >
                        Inbox
                    </button>
                    <button
                        type="button"
                        onClick={() => setScheduled(true)}
                        className={cn(
                            'flex-1 py-2.5 rounded-md border-[1.5px] text-sm font-semibold transition-colors',
                            scheduled ? 'border-accent bg-accent-subtle text-accent' : 'border-border bg-bg-secondary text-text-secondary'
                        )}
                    >
                        Scheduled
                    </button>
                </div>
                {scheduled && (
                    <div className="flex gap-2 mt-2.5">
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(fieldClass, 'flex-1 min-w-0')} />
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={cn(fieldClass, 'flex-[0_0_128px]')} />
                    </div>
                )}
            </div>

            {goals.length > 0 && (
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary">Link to goal</span>
                    <div className="relative">
                        <select
                            value={goalId}
                            onChange={(e) => setGoalId(e.target.value)}
                            className={cn(fieldClass, 'appearance-none pr-9 cursor-pointer')}
                        >
                            <option value="">No goal</option>
                            {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
                    </div>
                </label>
            )}

            <button
                type="button"
                onClick={() => setPriority((p) => !p)}
                className={cn(
                    'flex items-center gap-2.5 p-3 rounded-md border-[1.5px] transition-colors',
                    priority ? 'border-priority bg-priority-bg' : 'border-border bg-bg-secondary'
                )}
            >
                <Star className={cn('w-[19px] h-[19px]', priority ? 'text-priority' : 'text-text-tertiary')} fill={priority ? 'currentColor' : 'none'} strokeWidth={1.8} />
                <span className="text-base font-semibold text-text-primary">Mark as priority</span>
                <span className={cn('ml-auto w-10 h-6 rounded-full p-0.5 transition-colors', priority ? 'bg-accent' : 'bg-bg-tertiary')}>
                    <span className={cn('block w-5 h-5 rounded-full bg-white transition-transform', priority && 'translate-x-4')} />
                </span>
            </button>

            {submitError && <p className="text-sm text-danger font-medium">{submitError}</p>}

            <div className="flex gap-2.5 mt-1">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-md border-[1.5px] border-border bg-bg-primary text-text-primary text-base font-semibold hover:bg-bg-secondary transition"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-[1.4] py-3 rounded-md bg-accent text-on-accent text-base font-semibold shadow-[0_6px_16px_var(--accent-glow)] hover:brightness-105 transition disabled:opacity-60"
                >
                    {loading ? 'Saving…' : initialTask ? 'Save changes' : 'Add task'}
                </button>
            </div>
        </form>
    );
}
