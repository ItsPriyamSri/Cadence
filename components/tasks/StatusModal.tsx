'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store/app';
import { useTasksStore } from '@/lib/store/optimistic';
import { updateTaskStatus } from '@/lib/actions/tasks';
import { fadeIn } from '@/lib/utils/animations';
import { cn } from '@/lib/utils/cn';

export function StatusModal() {
    const { isStatusModalOpen, statusModalTaskId, closeStatusModal, triggerConfetti } = useAppStore();
    const { tasks } = useTasksStore();

    const task = tasks.find((t) => t.id === statusModalTaskId);

    if (!task) return null;

    const handleAction = async (action: 'pause' | 'resume' | 'done') => {
        closeStatusModal();

        // Small delay for modal close animation
        setTimeout(async () => {
            switch (action) {
                case 'pause':
                    await updateTaskStatus(task.id, 'paused');
                    break;
                case 'resume':
                    await updateTaskStatus(task.id, 'started');
                    break;
                case 'done':
                    await updateTaskStatus(task.id, 'done');
                    // Trigger confetti celebration!
                    triggerConfetti();
                    break;
            }
        }, 100);
    };

    return (
        <Modal isOpen={isStatusModalOpen} onClose={closeStatusModal} showClose={false}>
            <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="p-6"
            >
                {/* Task title */}
                <div className="text-center mb-6">
                    <p className="text-sm text-text-secondary mb-1">Update task</p>
                    <p className="text-lg font-semibold text-text-primary">{task.title}</p>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                    {task.status === 'started' && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAction('pause')}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-2xl',
                                    'bg-[#ffbe0b]/10 border-2 border-[#ffbe0b]/30',
                                    'hover:border-[#ffbe0b]/60 transition-colors'
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-[#ffbe0b]/20 flex items-center justify-center">
                                    <Pause className="w-6 h-6 text-[#ffbe0b]" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-text-primary">Pause Task</p>
                                    <p className="text-sm text-text-secondary">Take a break, continue later</p>
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAction('done')}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-2xl',
                                    'bg-gradient-to-r from-[#06d6a0]/10 to-[#00b894]/10',
                                    'border-2 border-[#06d6a0]/30',
                                    'hover:border-[#06d6a0]/60 transition-colors'
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06d6a0] to-[#00b894] flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-text-primary">Mark as Done</p>
                                    <p className="text-sm text-text-secondary">Celebrate your progress! 🎉</p>
                                </div>
                            </motion.button>
                        </>
                    )}

                    {task.status === 'paused' && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAction('resume')}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-2xl',
                                    'bg-gradient-to-r from-[#06d6a0]/10 to-[#00b894]/10',
                                    'border-2 border-[#06d6a0]/30',
                                    'hover:border-[#06d6a0]/60 transition-colors'
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06d6a0] to-[#00b894] flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-text-primary">Resume Task</p>
                                    <p className="text-sm text-text-secondary">Continue where you left off</p>
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAction('done')}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-2xl',
                                    'bg-bg-secondary border-2 border-border',
                                    'hover:border-[#06d6a0]/40 transition-colors'
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-complete/20 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-complete" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-text-primary">Mark as Done</p>
                                    <p className="text-sm text-text-secondary">Complete without resuming</p>
                                </div>
                            </motion.button>
                        </>
                    )}

                    {task.status === 'default' && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAction('resume')}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-2xl',
                                    'bg-gradient-to-r from-[#06d6a0]/10 to-[#00b894]/10',
                                    'border-2 border-[#06d6a0]/30',
                                    'hover:border-[#06d6a0]/60 transition-colors'
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06d6a0] to-[#00b894] flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-text-primary">Start Task</p>
                                    <p className="text-sm text-text-secondary">Begin working on this</p>
                                </div>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleAction('done')}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-2xl',
                                    'bg-bg-secondary border-2 border-border',
                                    'hover:border-[#06d6a0]/40 transition-colors'
                                )}
                            >
                                <div className="w-12 h-12 rounded-xl bg-complete/20 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-complete" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-text-primary">Mark as Done</p>
                                    <p className="text-sm text-text-secondary">Already completed</p>
                                </div>
                            </motion.button>
                        </>
                    )}
                </div>

                {/* Cancel button */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeStatusModal}
                    className="w-full mt-4 p-3 text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
                >
                    Cancel
                </motion.button>
            </motion.div>
        </Modal>
    );
}
