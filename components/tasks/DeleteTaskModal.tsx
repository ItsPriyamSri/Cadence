'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store/app';
import { useTasksStore } from '@/lib/store/optimistic';
import { deleteTask } from '@/lib/actions/tasks';

export function DeleteTaskModal() {
    const { confirmDeleteTaskId, closeDeleteConfirm } = useAppStore();
    const { tasks } = useTasksStore();
    const task = tasks.find((t) => t.id === confirmDeleteTaskId);

    const handleConfirm = () => {
        if (task) deleteTask(task.id);
        closeDeleteConfirm();
    };

    return (
        <Modal isOpen={!!confirmDeleteTaskId && !!task} onClose={closeDeleteConfirm} showClose={false}>
            <div className="p-5 text-center">
                <div className="w-14 h-14 mx-auto mb-3.5 rounded-lg bg-danger-bg text-danger flex items-center justify-center">
                    <Trash2 className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-text-primary mb-1.5">Delete this task?</h2>
                <p className="text-sm text-text-secondary mb-5">
                    &ldquo;{task?.title}&rdquo; will be permanently removed.
                </p>
                <div className="flex gap-2.5">
                    <button
                        onClick={closeDeleteConfirm}
                        className="flex-1 py-3 rounded-md border-[1.5px] border-border bg-bg-primary text-text-primary text-base font-semibold hover:bg-bg-secondary transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 rounded-md bg-danger text-white text-base font-semibold hover:brightness-105 transition"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </Modal>
    );
}
