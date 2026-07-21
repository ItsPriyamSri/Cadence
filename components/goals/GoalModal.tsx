'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store/app';
import { useGoals } from '@/lib/hooks/useGoals';
import { createGoal, updateGoal, deleteGoal, GoalType } from '@/lib/actions/goals';
import {
    startOfWeek, endOfWeek, startOfMonth, endOfMonth, format,
} from 'date-fns';
import { cn } from '@/lib/utils/cn';

const typeOptions: { id: GoalType; label: string }[] = [
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
];

const fieldClass =
    'w-full box-border px-3.5 py-3 rounded-md border-[1.5px] border-border bg-bg-secondary text-text-primary text-base font-[inherit] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-subtle)] focus:bg-bg-primary transition';

export function GoalModal() {
    const { isGoalModalOpen, editingGoalId, closeGoalModal } = useAppStore();
    const { goals } = useGoals();
    const editingGoal = goals.find((g) => g.id === editingGoalId);

    const [title, setTitle] = useState('');
    const [type, setType] = useState<GoalType>('weekly');
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (editingGoal) {
            setTitle(editingGoal.title);
            setType(editingGoal.type);
            setProgress(Math.round(editingGoal.progress ?? 0));
        } else {
            setTitle('');
            setType('weekly');
            setProgress(0);
        }
        setError(false);
        setSubmitError('');
    }, [editingGoal, isGoalModalOpen]);

    const dateRange = useMemo(() => {
        const now = new Date();
        switch (type) {
            case 'weekly':
                return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
            case 'monthly':
                return { start: startOfMonth(now), end: endOfMonth(now) };
            case 'quarterly': {
                const quarter = Math.floor(now.getMonth() / 3);
                return { start: new Date(now.getFullYear(), quarter * 3, 1), end: new Date(now.getFullYear(), quarter * 3 + 3, 0) };
            }
        }
    }, [type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError(true); return; }
        setLoading(true);
        setSubmitError('');
        try {
            if (editingGoal) {
                await updateGoal(editingGoal.id, { title: title.trim(), type, progress });
            } else {
                await createGoal({ title: title.trim(), type, progress });
            }
            closeGoalModal();
        } catch (err) {
            console.error('Failed to save goal:', err);
            setSubmitError('Could not save the goal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingGoal) return;
        setLoading(true);
        setSubmitError('');
        try {
            await deleteGoal(editingGoal.id);
            closeGoalModal();
        } catch (err) {
            console.error('Failed to delete goal:', err);
            setSubmitError('Could not delete the goal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isGoalModalOpen} onClose={closeGoalModal} title={editingGoal ? 'Edit Goal' : 'New Goal'}>
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-text-secondary">Goal title</span>
                    <input
                        autoFocus
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); if (error) setError(false); }}
                        placeholder="What do you want to achieve?"
                        className={cn(fieldClass, error && 'border-danger')}
                    />
                    {error && <span className="text-xs font-medium text-danger">A title is required.</span>}
                </label>

                <div>
                    <span className="text-xs font-semibold text-text-secondary">Type</span>
                    <div className="flex gap-2 mt-1.5">
                        {typeOptions.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setType(opt.id)}
                                className={cn(
                                    'flex-1 py-2.5 rounded-md border-[1.5px] text-sm font-semibold transition-colors',
                                    type === opt.id ? 'border-accent bg-accent-subtle text-accent' : 'border-border bg-bg-secondary text-text-secondary'
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-text-tertiary">
                        {format(dateRange.start, 'MMM d')} – {format(dateRange.end, 'MMM d, yyyy')}
                    </p>
                </div>

                <div>
                    <div className="flex items-center mb-2.5">
                        <span className="text-xs font-semibold text-text-secondary">Progress</span>
                        <span className="ml-auto text-sm font-bold text-accent tabular-nums">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden mb-2">
                        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
                    </div>
                    <input
                        type="range" min={0} max={100} step={5}
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="w-full cursor-pointer"
                        style={{ accentColor: 'var(--accent)' }}
                    />
                </div>

                {submitError && <p className="text-sm text-danger font-medium">{submitError}</p>}

                <div className="flex gap-2.5 mt-1">
                    {editingGoal && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            aria-label="Delete goal"
                            className="shrink-0 flex items-center px-4 rounded-md border-[1.5px] border-danger bg-danger-bg text-danger disabled:opacity-60"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={closeGoalModal}
                        className="flex-1 py-3 rounded-md border-[1.5px] border-border bg-bg-primary text-text-primary text-base font-semibold hover:bg-bg-secondary transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[1.4] py-3 rounded-md bg-accent text-on-accent text-base font-semibold shadow-[0_6px_16px_var(--accent-glow)] hover:brightness-105 transition disabled:opacity-60"
                    >
                        {editingGoal ? 'Save changes' : 'Create goal'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
