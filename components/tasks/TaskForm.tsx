'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createTask, updateTask } from '@/lib/actions/tasks';
import { useActiveGoals } from '@/lib/hooks/useGoals';
import { Task } from '@/lib/firebase/firestore';

interface TaskFormProps {
    initialTask?: Task | null;
    onClose: () => void;
}

export function TaskForm({ initialTask, onClose }: TaskFormProps) {
    const [title, setTitle] = useState(initialTask?.title || '');
    const [selectedGoalId, setSelectedGoalId] = useState<string>(
        initialTask?.goalId || ''
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { goals } = useActiveGoals();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('Task title is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (initialTask) {
                await updateTask(initialTask.id, {
                    title: title.trim(),
                    goalId: selectedGoalId || null,
                });
            } else {
                await createTask({
                    title: title.trim(),
                    goalId: selectedGoalId || null,
                });
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save task');
        } finally {
            setLoading(false);
        }
    };

    const goalOptions = [
        { value: '', label: 'No goal' },
        ...goals.map((goal) => ({ value: goal.id, label: goal.title })),
    ];

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <Input
                placeholder="What do you want to work on?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={error}
                autoFocus
            />

            {goals.length > 0 && (
                <Select
                    label="Link to goal (optional)"
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    options={goalOptions}
                />
            )}

            <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                    Cancel
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                    {initialTask ? 'Update' : 'Add'} Task
                </Button>
            </div>
        </form>
    );
}
