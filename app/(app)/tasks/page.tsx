'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { StatusModal } from '@/components/tasks/StatusModal';
import { DeleteTaskModal } from '@/components/tasks/DeleteTaskModal';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store/app';
import { useTasks } from '@/lib/hooks/useTasks';
import { fadeIn } from '@/lib/utils/animations';

export default function TasksPage() {
    const { isTaskFormOpen, editingTaskId, closeTaskForm } = useAppStore();
    const { tasks } = useTasks();

    const editingTask = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;

    return (
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="max-w-[820px] mx-auto px-4 pt-3 md:px-8 md:pt-0 pb-[calc(env(safe-area-inset-bottom,0px)+120px)] md:pb-10">
            <h1 className="md:hidden mb-3.5 mt-1 mx-1 text-xl font-bold tracking-tight text-text-primary">Tasks</h1>
            <TaskList />

            <Modal
                isOpen={isTaskFormOpen}
                onClose={closeTaskForm}
                title={editingTaskId ? 'Edit Task' : 'New Task'}
            >
                <TaskForm initialTask={editingTask} onClose={closeTaskForm} />
            </Modal>

            <StatusModal />
            <DeleteTaskModal />
        </motion.div>
    );
}
