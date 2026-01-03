'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Circle, Play, Pause, CheckCircle, Clock, Target, Star,
    MoreVertical, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Task } from '@/lib/firebase/firestore';
import { updateTaskStatus, getNextStatus, updateTask, deleteTask } from '@/lib/actions/tasks';
import { useAppStore } from '@/lib/store/app';
import {
    pulseGreen,
    pulseTransition,
    listItem,
    celebrationPop,
} from '@/lib/utils/animations';
import { formatShortDate, formatTime } from '@/lib/utils/dates';

interface TaskCardProps {
    task: Task;
}

const statusConfig = {
    default: {
        bg: 'bg-bg-secondary/50',
        border: 'border-border hover:border-accent/30',
        icon: Circle,
        iconColor: 'text-text-secondary group-hover:text-accent',
        iconBg: 'bg-transparent group-hover:bg-accent/10',
        pulse: false,
    },
    started: {
        bg: 'bg-gradient-to-r from-[#ffbe0b]/10 to-[#fb5607]/5',
        border: 'border-[#ffbe0b]/50',
        icon: Play,
        iconColor: 'text-[#ffbe0b]',
        iconBg: 'bg-[#ffbe0b]/20',
        pulse: true,
    },
    paused: {
        bg: 'bg-bg-secondary/60',
        border: 'border-[#888]/40',
        icon: Pause,
        iconColor: 'text-[#888]',
        iconBg: 'bg-[#888]/20',
        pulse: false,
    },
    done: {
        bg: 'bg-[#06d6a0]/5',
        border: 'border-[#06d6a0]/30',
        icon: CheckCircle,
        iconColor: 'text-[#06d6a0]',
        iconBg: 'bg-[#06d6a0]/10',
        pulse: false,
    },
};

export function TaskCard({ task }: TaskCardProps) {
    const config = statusConfig[task.status];
    const Icon = config.icon;
    const { openStatusModal, contextMenuTaskId, openContextMenu, closeContextMenu } = useAppStore();
    const [isAnimating, setIsAnimating] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const isMenuOpen = contextMenuTaskId === task.id;

    const handleTaskClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (task.status === 'done') return;

        const nextStatus = getNextStatus(task.status);
        if (nextStatus) {
            setIsAnimating(true);
            await updateTaskStatus(task.id, nextStatus);
            setTimeout(() => setIsAnimating(false), 500);
        }
    };

    const handleIconClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        openStatusModal(task.id);
    };

    const handlePriorityToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateTask(task.id, { priority: !task.priority });
    };

    const handleDelete = async () => {
        closeContextMenu();
        await deleteTask(task.id);
    };

    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            openContextMenu(task.id);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    return (
        <motion.div
            layout
            layoutId={task.id}
            variants={listItem}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleTaskClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={() => { setShowMenu(false); if (isMenuOpen) closeContextMenu(); }}
            className={cn(
                'group relative p-4 border-2 rounded-2xl transition-all cursor-pointer',
                'hover:shadow-lg active:scale-[0.98]',
                config.bg,
                config.border,
                task.status === 'done' && 'opacity-60',
                task.priority && 'ring-2 ring-[#ffbe0b]/30'
            )}
        >
            <div className="flex items-start gap-3">
                {/* Status Icon Button */}
                <motion.button
                    onClick={handleIconClick}
                    className="flex-shrink-0 mt-0.5 relative z-10"
                    aria-label={`Task options for ${task.title}`}
                    variants={isAnimating ? celebrationPop : undefined}
                    initial="initial"
                    animate={isAnimating ? 'animate' : 'initial'}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <motion.div
                        animate={config.pulse ? pulseGreen.animate : undefined}
                        transition={config.pulse ? pulseTransition : undefined}
                        className={cn(
                            'w-9 h-9 flex items-center justify-center rounded-full',
                            'transition-all duration-200',
                            config.iconBg,
                            config.iconColor
                        )}
                    >
                        <Icon className="w-5 h-5" strokeWidth={2.5} />
                    </motion.div>
                </motion.button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                    <motion.p
                        layout
                        className={cn(
                            'text-base font-medium text-text-primary leading-snug',
                            task.status === 'done' && 'line-through text-text-secondary'
                        )}
                    >
                        {task.title}
                    </motion.p>

                    {/* Show date AND start-end time if scheduled */}
                    {task.calendarSlot && task.calendarSlot.date && (
                        <motion.div
                            layout
                            className="flex flex-wrap items-center gap-2 mt-2"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 text-accent rounded-lg text-xs font-medium"
                            >
                                <Clock className="w-3 h-3" />
                                <span>
                                    {formatShortDate(new Date(task.calendarSlot.date + 'T00:00:00'))} • {formatTime(task.calendarSlot.startTime)} - {formatTime(task.calendarSlot.endTime)}
                                </span>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Goal badge */}
                    {task.goalId && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1 px-2 py-1 mt-2 bg-[#8338ec]/10 text-[#8338ec] rounded-lg text-xs font-medium"
                        >
                            <Target className="w-3 h-3" />
                            <span>Goal linked</span>
                        </motion.div>
                    )}
                </div>

                {/* Priority Star */}
                <motion.button
                    onClick={handlePriorityToggle}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex-shrink-0 p-1"
                >
                    <Star
                        className={cn(
                            'w-5 h-5 transition-colors',
                            task.priority
                                ? 'fill-[#ffbe0b] text-[#ffbe0b] priority-star'
                                : 'text-text-secondary/30 hover:text-[#ffbe0b]/50'
                        )}
                    />
                </motion.button>

                {/* 3-Dot Menu */}
                <AnimatePresence>
                    {(showMenu || isMenuOpen) && task.status !== 'done' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative"
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    isMenuOpen ? closeContextMenu() : openContextMenu(task.id);
                                }}
                                className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors"
                            >
                                <MoreVertical className="w-4 h-4 text-text-secondary" />
                            </button>

                            <AnimatePresence>
                                {isMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-1 py-1 bg-bg-primary border border-border rounded-xl shadow-xl z-50 min-w-[140px]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={handleDelete}
                                            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Status indicator dot */}
                {task.status === 'started' && (
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute top-2 right-2 w-2 h-2 bg-[#ffbe0b] rounded-full"
                    />
                )}
            </div>
        </motion.div>
    );
}
