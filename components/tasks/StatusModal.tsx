'use client';

import React from 'react';
import { Circle, Play, Pause, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store/app';
import { useTasksStore } from '@/lib/store/optimistic';
import { updateTaskStatus, TaskStatus } from '@/lib/actions/tasks';
import { cn } from '@/lib/utils/cn';

const options: { id: TaskStatus; label: string; desc: string; icon: React.ReactNode; tone: string }[] = [
    { id: 'default', label: 'Not started', desc: 'Waiting to begin', icon: <Circle className="w-5 h-5" />, tone: 'bg-bg-secondary text-text-tertiary' },
    { id: 'started', label: 'Started', desc: 'In progress right now', icon: <Play className="w-5 h-5" fill="currentColor" strokeWidth={0} />, tone: 'bg-started-bg text-started' },
    { id: 'paused', label: 'Paused', desc: 'On hold for now', icon: <Pause className="w-5 h-5" strokeWidth={2.4} />, tone: 'bg-paused-bg text-paused' },
    { id: 'done', label: 'Done', desc: 'Completed — celebrate it 🎉', icon: <Check className="w-5 h-5" strokeWidth={2.6} />, tone: 'bg-done-bg text-done' },
];

export function StatusModal() {
    const { isStatusModalOpen, statusModalTaskId, closeStatusModal, triggerConfetti } = useAppStore();
    const { tasks } = useTasksStore();
    const task = tasks.find((t) => t.id === statusModalTaskId);

    const pick = (status: TaskStatus) => {
        closeStatusModal();
        setTimeout(async () => {
            await updateTaskStatus(task!.id, status);
            if (status === 'done') triggerConfetti();
        }, 100);
    };

    return (
        <Modal isOpen={isStatusModalOpen && !!task} onClose={closeStatusModal} title="Update status">
            <div className="p-5">
                <p className="mb-4 text-sm text-text-secondary">{task?.title}</p>
                <div className="flex flex-col gap-2">
                    {options.map((opt) => {
                        const active = task?.status === opt.id;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => pick(opt.id)}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-md border text-left transition-colors',
                                    active ? 'border-accent bg-accent-subtle' : 'border-border bg-bg-secondary hover:bg-bg-tertiary'
                                )}
                            >
                                <span className={cn('shrink-0 w-10 h-10 rounded-full flex items-center justify-center', opt.tone)}>
                                    {opt.icon}
                                </span>
                                <div className="flex-1">
                                    <div className="text-base font-semibold text-text-primary">{opt.label}</div>
                                    <div className="text-xs text-text-tertiary">{opt.desc}</div>
                                </div>
                                {active && <Check className="w-5 h-5 text-accent" strokeWidth={2.4} />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </Modal>
    );
}
