'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, RepeatRule } from '@/lib/firebase/firestore';
import { createTask, updateTask } from '@/lib/actions/tasks';
import { setTaskRepeat, setHabitColor, setSameTimeWeekly } from '@/lib/actions/habits';
import { HABIT_PALETTE, nextHabitColor } from '@/lib/habits/palette';
import { useTasksStore } from '@/lib/store/optimistic';
import { Check, Trash2 } from 'lucide-react';
import { useAppStore } from '@/lib/store/app';
import { cn } from '@/lib/utils/cn';

interface HabitFormProps {
    initialHabit?: Task | null;
    onClose: () => void;
}

type RepeatTab = 'off' | 'daily' | 'everyN' | 'weekdays';

const WEEKDAYS = [
    { label: 'S', day: 0 },
    { label: 'M', day: 1 },
    { label: 'T', day: 2 },
    { label: 'W', day: 3 },
    { label: 'T', day: 4 },
    { label: 'F', day: 5 },
    { label: 'S', day: 6 },
];

const fieldClass =
    'w-full box-border px-3.5 py-3 rounded-md border-[1.5px] border-border bg-bg-secondary text-text-primary text-base font-[inherit] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-subtle)] focus:bg-bg-primary transition';

export function HabitForm({ initialHabit, onClose }: HabitFormProps) {
    const router = useRouter();
    const openDeleteConfirm = useAppStore((s) => s.openDeleteConfirm);

    const [title, setTitle] = useState(initialHabit?.title || '');
    const [titleError, setTitleError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Determine initial repeat mode
    const initialRule = initialHabit?.repeat;
    const [repeatMode, setRepeatMode] = useState<RepeatTab>(
        initialRule ? initialRule.kind : 'daily'
    );

    const [everyN, setEveryN] = useState<number>(
        initialRule?.kind === 'everyN' ? initialRule.n : 2
    );

    const [selectedDays, setSelectedDays] = useState<number[]>(
        initialRule?.kind === 'weekdays' ? initialRule.days : [1, 2, 3, 4, 5]
    );

    // Color selection
    const [color, setColor] = useState<string>(() => {
        if (initialHabit?.color) return initialHabit.color;
        const otherHexes = useTasksStore
            .getState()
            .tasks.filter((t) => t.id !== initialHabit?.id && t.repeat !== null && t.color)
            .map((t) => t.color as string);
        return nextHabitColor(otherHexes);
    });
    const [sameTimeWeekly, setSameTimeWeeklyState] = useState<boolean>(
        initialHabit?.sameTimeWeekly ?? false
    );

    const toggleWeekday = (day: number) => {
        if (selectedDays.includes(day)) {
            if (selectedDays.length > 1) {
                setSelectedDays(selectedDays.filter((d) => d !== day));
            }
        } else {
            setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) {
            setTitleError(true);
            return;
        }

        setLoading(true);
        setSubmitError('');

        try {
            let rule: RepeatRule | null = null;
            if (repeatMode === 'daily') {
                rule = { kind: 'daily' };
            } else if (repeatMode === 'everyN') {
                rule = { kind: 'everyN', n: Math.max(2, everyN) };
            } else if (repeatMode === 'weekdays') {
                const days = selectedDays.length > 0 ? selectedDays : [1, 2, 3, 4, 5];
                rule = { kind: 'weekdays', days };
            } else if (repeatMode === 'off') {
                rule = null;
            }

            if (initialHabit) {
                if (rule === null) {
                    await updateTask(initialHabit.id, { title: trimmed });
                    await setTaskRepeat(initialHabit.id, null);
                    onClose();
                    router.push('/habits');
                    return;
                }

                await updateTask(initialHabit.id, { title: trimmed });
                await setTaskRepeat(initialHabit.id, rule, {
                    sameTimeWeekly,
                    color,
                });
                await setHabitColor(initialHabit.id, color);
                await setSameTimeWeekly(initialHabit.id, sameTimeWeekly);
            } else {
                if (rule === null) {
                    // Creating one-off from habit form
                    await createTask({ title: trimmed });
                } else {
                    const taskId = await createTask({ title: trimmed });
                    await setTaskRepeat(taskId, rule, {
                        sameTimeWeekly,
                        color,
                    });
                }
            }

            onClose();
        } catch (err) {
            console.error('Failed to save habit:', err);
            setSubmitError('Could not save the habit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            {/* Title */}
            <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-text-secondary">Habit title</span>
                <input
                    autoFocus
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        if (titleError) setTitleError(false);
                    }}
                    placeholder="e.g., Read 20 pages, Morning run"
                    className={cn(fieldClass, titleError && 'border-danger')}
                />
                {titleError && (
                    <span className="text-xs font-medium text-danger">A title is required.</span>
                )}
            </label>

            {/* Repeat Mode */}
            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-text-secondary">Repeat</span>
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-md bg-bg-secondary border border-border">
                    {(['off', 'daily', 'everyN', 'weekdays'] as RepeatTab[]).map((tab) => {
                        const labels: Record<RepeatTab, string> = {
                            off: 'Off',
                            daily: 'Daily',
                            everyN: 'Every N',
                            weekdays: 'Days',
                        };
                        const isActive = repeatMode === tab;
                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setRepeatMode(tab)}
                                className={cn(
                                    'py-2 px-1 text-xs font-semibold rounded transition-colors',
                                    isActive
                                        ? 'bg-bg-primary text-accent shadow-sm'
                                        : 'text-text-secondary hover:text-text-primary'
                                )}
                            >
                                {labels[tab]}
                            </button>
                        );
                    })}
                </div>

                {/* Sub-options for Every N and Weekdays */}
                {repeatMode === 'everyN' && (
                    <div className="flex items-center gap-3 mt-1.5 p-3 rounded-md bg-bg-secondary border border-border">
                        <span className="text-sm font-semibold text-text-primary">Every</span>
                        <input
                            type="number"
                            min={2}
                            max={365}
                            value={everyN}
                            onChange={(e) => setEveryN(Math.max(2, parseInt(e.target.value) || 2))}
                            className="w-20 px-3 py-1.5 rounded border border-border bg-bg-primary text-text-primary font-semibold text-center text-sm outline-none focus:border-accent"
                        />
                        <span className="text-sm font-semibold text-text-primary">days</span>
                    </div>
                )}

                {repeatMode === 'weekdays' && (
                    <div className="flex justify-between gap-1 mt-1.5">
                        {WEEKDAYS.map(({ label, day }) => {
                            const isSelected = selectedDays.includes(day);
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleWeekday(day)}
                                    className={cn(
                                        'flex-1 aspect-square max-w-[42px] rounded-lg font-bold text-xs flex items-center justify-center transition-all',
                                        isSelected
                                            ? 'bg-accent text-on-accent shadow-sm'
                                            : 'bg-bg-secondary text-text-secondary border border-border hover:text-text-primary'
                                    )}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Color swatches */}
            {repeatMode !== 'off' && (
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary">Color</span>
                    <div className="flex items-center justify-between gap-1.5 p-2 rounded-md bg-bg-secondary border border-border">
                        {HABIT_PALETTE.map((hex) => {
                            const isSelected = color.toLowerCase() === hex.toLowerCase();
                            return (
                                <button
                                    key={hex}
                                    type="button"
                                    onClick={() => setColor(hex)}
                                    aria-label={`Select color ${hex}`}
                                    className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center transition-transform active:scale-90',
                                        isSelected && 'ring-2 ring-offset-2 ring-offset-bg-primary ring-accent'
                                    )}
                                    style={{ backgroundColor: hex }}
                                >
                                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Same time weekly toggle */}
            {repeatMode !== 'off' && (
                <div className="flex flex-col gap-1.5 p-3.5 rounded-md bg-bg-secondary border border-border">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-text-primary">
                            Same time this week
                        </span>
                        <button
                            type="button"
                            onClick={() => setSameTimeWeeklyState((prev) => !prev)}
                            aria-label="Toggle same time weekly"
                            className={cn(
                                'w-10 h-6 rounded-full p-0.5 transition-colors',
                                sameTimeWeekly ? 'bg-accent' : 'bg-bg-tertiary'
                            )}
                        >
                            <span
                                className={cn(
                                    'block w-5 h-5 rounded-full bg-white transition-transform',
                                    sameTimeWeekly && 'translate-x-4'
                                )}
                            />
                        </button>
                    </div>
                    <p className="text-xs text-text-tertiary leading-relaxed mt-0.5">
                        Once you schedule it, this week’s due days share that clock. Next week fills itself.
                    </p>
                </div>
            )}

            {submitError && <p className="text-sm text-danger font-medium">{submitError}</p>}

            {initialHabit && (
                <button
                    type="button"
                    onClick={() => {
                        const id = initialHabit.id;
                        onClose();
                        openDeleteConfirm(id);
                    }}
                    className="w-full py-3 rounded-md border-[1.5px] border-border text-danger text-sm font-semibold hover:bg-danger-bg transition flex items-center justify-center gap-2"
                >
                    <Trash2 className="w-4 h-4" /> Delete habit
                </button>
            )}

            {/* Form actions */}
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
                    {loading ? 'Saving…' : initialHabit ? 'Save changes' : 'Add habit'}
                </button>
            </div>
        </form>
    );
}
