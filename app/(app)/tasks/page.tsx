'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { StatusModal } from '@/components/tasks/StatusModal';
import { Modal } from '@/components/ui/Modal';
import { Confetti } from '@/components/ui/Confetti';
import { useAppStore } from '@/lib/store/app';
import { useTasks } from '@/lib/hooks/useTasks';
import { fadeIn } from '@/lib/utils/animations';

export default function TasksPage() {
    const { isTaskFormOpen, editingTaskId, closeTaskForm } = useAppStore();
    const { tasks } = useTasks();

    const editingTask = editingTaskId
        ? tasks.find((t) => t.id === editingTaskId)
        : null;

    return (
        <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto"
        >
            {/* Tasks Section */}
            <div className="p-4">
                <h1 className="text-2xl font-bold text-text-primary mb-4">Tasks</h1>
                <TaskList />
            </div>

            {/* Task Form Modal */}
            <Modal
                isOpen={isTaskFormOpen}
                onClose={closeTaskForm}
                title={editingTaskId ? 'Edit Task' : 'New Task'}
            >
                <TaskForm initialTask={editingTask} onClose={closeTaskForm} />
            </Modal>

            {/* Status Change Modal */}
            <StatusModal />

            {/* Confetti Celebration */}
            <Confetti />
        </motion.div>
    );
}
