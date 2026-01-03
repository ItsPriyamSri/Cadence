'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAppStore } from '@/lib/store/app';
import { useGoals } from '@/lib/hooks/useGoals';
import { createGoal, updateGoal, deleteGoal, GoalType } from '@/lib/actions/goals';
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    format,
} from 'date-fns';

const typeOptions = [
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'quarterly', label: 'This Quarter' },
];

export function GoalModal() {
    const { isGoalModalOpen, editingGoalId, closeGoalModal } = useAppStore();
    const { goals } = useGoals();

    const editingGoal = goals.find((g) => g.id === editingGoalId);

    const [title, setTitle] = useState('');
    const [type, setType] = useState<GoalType>('weekly');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editingGoal) {
            setTitle(editingGoal.title);
            setType(editingGoal.type);
        } else {
            setTitle('');
            setType('weekly');
        }
    }, [editingGoal, isGoalModalOpen]);

    const dateRange = useMemo(() => {
        const now = new Date();
        switch (type) {
            case 'weekly':
                return {
                    start: startOfWeek(now, { weekStartsOn: 1 }),
                    end: endOfWeek(now, { weekStartsOn: 1 }),
                };
            case 'monthly':
                return {
                    start: startOfMonth(now),
                    end: endOfMonth(now),
                };
            case 'quarterly':
                const quarter = Math.floor(now.getMonth() / 3);
                const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
                const quarterEnd = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                return { start: quarterStart, end: quarterEnd };
        }
    }, [type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('Goal title is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (editingGoal) {
                await updateGoal(editingGoal.id, { title: title.trim() });
            } else {
                await createGoal({ title: title.trim(), type });
            }
            closeGoalModal();
        } catch (err: any) {
            setError(err.message || 'Failed to save goal');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editingGoal) return;
        setLoading(true);
        try {
            await deleteGoal(editingGoal.id);
            closeGoalModal();
        } catch (err: any) {
            setError(err.message || 'Failed to delete goal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isGoalModalOpen}
            onClose={closeGoalModal}
            title={editingGoal ? 'Edit Goal' : 'Create Goal'}
        >
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <Input
                    placeholder="What do you want to achieve?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={error}
                    autoFocus
                />

                {!editingGoal && (
                    <Select
                        label="Goal Duration"
                        value={type}
                        onChange={(e) => setType(e.target.value as GoalType)}
                        options={typeOptions}
                    />
                )}

                <div className="text-sm text-text-secondary">
                    {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
                </div>

                <div className="flex gap-2 pt-2">
                    {editingGoal && (
                        <Button
                            type="button"
                            variant="danger"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            Delete
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={closeGoalModal}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading} className="flex-1">
                        {editingGoal ? 'Update' : 'Create'} Goal
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
