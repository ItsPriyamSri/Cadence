'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, CheckCircle, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store/app';
import { useTasksStore } from '@/lib/store/optimistic';
import { updateTaskStatus } from '@/lib/actions/tasks';
import { cn } from '@/lib/utils/cn';

// UX Color System:
// - Start/Resume: Amber/Peach (#f4a261) - action, energy
// - Pause: Gray - neutral, on hold
// - Done: Green (#4ecdc4) - success, completion

export function StatusModal() {
    const { isStatusModalOpen, statusModalTaskId, closeStatusModal, triggerConfetti } = useAppStore();
    const { tasks } = useTasksStore();

    const task = tasks.find((t) => t.id === statusModalTaskId);

    if (!task) return null;

    const handleAction = async (action: 'pause' | 'resume' | 'done') => {
        closeStatusModal();

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
                    triggerConfetti();
                    break;
            }
        }, 100);
    };

    return (
        <Modal isOpen={isStatusModalOpen} onClose={closeStatusModal} showClose={false}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6"
            >
                {/* Task title with subtle badge */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4ecdc4]/10 rounded-full text-xs font-medium text-[#4ecdc4] mb-3">
                        <Sparkles className="w-3 h-3" />
                        Update Status
                    </div>
                    <h3 className="text-xl font-bold text-text-primary leading-tight">
                        {task.title}
                    </h3>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                    {task.status === 'started' && (
                        <>
                            <ActionButton
                                onClick={() => handleAction('pause')}
                                icon={Pause}
                                iconBg="bg-bg-tertiary"
                                iconColor="text-text-secondary"
                                borderColor="border-border hover:border-border"
                                bg="bg-bg-secondary/50"
                                title="Pause Task"
                                subtitle="Take a break, continue later"
                            />
                            <ActionButton
                                onClick={() => handleAction('done')}
                                icon={CheckCircle}
                                iconBg="bg-[#4ecdc4]/15"
                                iconColor="text-[#4ecdc4]"
                                borderColor="border-[#4ecdc4]/30 hover:border-[#4ecdc4]/60"
                                bg="bg-[#4ecdc4]/5"
                                title="Mark as Done"
                                subtitle="Celebrate your progress! 🎉"
                                primary
                            />
                        </>
                    )}

                    {task.status === 'paused' && (
                        <>
                            <ActionButton
                                onClick={() => handleAction('resume')}
                                icon={Play}
                                iconBg="bg-[#f4a261]/15"
                                iconColor="text-[#f4a261]"
                                borderColor="border-[#f4a261]/30 hover:border-[#f4a261]/60"
                                bg="bg-[#f4a261]/5"
                                title="Resume Task"
                                subtitle="Continue where you left off"
                                primary
                            />
                            <ActionButton
                                onClick={() => handleAction('done')}
                                icon={CheckCircle}
                                iconBg="bg-bg-tertiary"
                                iconColor="text-text-secondary"
                                borderColor="border-border hover:border-[#4ecdc4]/40"
                                bg="bg-bg-secondary/50"
                                title="Mark as Done"
                                subtitle="Complete without resuming"
                            />
                        </>
                    )}

                    {task.status === 'default' && (
                        <>
                            <ActionButton
                                onClick={() => handleAction('resume')}
                                icon={Play}
                                iconBg="bg-[#f4a261]/15"
                                iconColor="text-[#f4a261]"
                                borderColor="border-[#f4a261]/30 hover:border-[#f4a261]/60"
                                bg="bg-[#f4a261]/5"
                                title="Start Task"
                                subtitle="Begin working on this"
                                primary
                            />
                            <ActionButton
                                onClick={() => handleAction('done')}
                                icon={CheckCircle}
                                iconBg="bg-bg-tertiary"
                                iconColor="text-text-secondary"
                                borderColor="border-border hover:border-[#4ecdc4]/40"
                                bg="bg-bg-secondary/50"
                                title="Mark as Done"
                                subtitle="Already completed"
                            />
                        </>
                    )}
                </div>

                {/* Cancel button */}
                <button
                    onClick={closeStatusModal}
                    className="w-full mt-6 p-3 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-xl transition-all duration-200 text-sm font-medium"
                >
                    Cancel
                </button>
            </motion.div>
        </Modal>
    );
}

interface ActionButtonProps {
    onClick: () => void;
    icon: typeof Play;
    iconBg: string;
    iconColor: string;
    borderColor: string;
    bg: string;
    title: string;
    subtitle: string;
    primary?: boolean;
}

function ActionButton({
    onClick,
    icon: Icon,
    iconBg,
    iconColor,
    borderColor,
    bg,
    title,
    subtitle,
    primary
}: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-4 p-4 rounded-2xl',
                'border-2 transition-all duration-200',
                'active:scale-[0.98]',
                borderColor,
                bg,
                primary && 'shadow-sm'
            )}
        >
            <div className={cn(
                'w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center',
                iconBg
            )}>
                <Icon className={cn('w-6 h-6', iconColor, Icon === Play && 'fill-current')} />
            </div>
            <div className="text-left flex-1">
                <p className="font-semibold text-text-primary">{title}</p>
                <p className="text-sm text-text-secondary">{subtitle}</p>
            </div>
        </button>
    );
}
