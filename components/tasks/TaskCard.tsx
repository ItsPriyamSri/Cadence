'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Circle, Play, Pause, CheckCircle, Clock, Target, Star,
    MoreVertical, Trash2, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Task } from '@/lib/firebase/firestore';
import { updateTaskStatus, getNextStatus, updateTask, deleteTask } from '@/lib/actions/tasks';
import { useAppStore } from '@/lib/store/app';
import {
    pulseGreen,
    celebrationPop,
} from '@/lib/utils/animations';
import { formatShortDate, formatTime } from '@/lib/utils/dates';

interface TaskCardProps {
    task: Task;
}

const statusConfig = {
    default: {
        bg: 'bg-bg-secondary/40',
        border: 'border-transparent hover:border-accent/20',
        icon: Circle,
        iconColor: 'text-text-secondary group-hover:text-accent',
        iconBg: 'bg-bg-primary group-hover:bg-accent/10',
        pulse: false,
    },
    started: {
        bg: 'bg-gradient-to-r from-[#ffbe0b]/10 to-[#fb5607]/5',
        border: 'border-[#ffbe0b]/30',
        icon: Play,
        iconColor: 'text-[#ffbe0b]',
        iconBg: 'bg-[#ffbe0b]/20',
        pulse: true,
    },
    paused: {
        bg: 'bg-bg-secondary/60',
        border: 'border-border',
        icon: Pause,
        iconColor: 'text-text-secondary',
        iconBg: 'bg-bg-tertiary',
        pulse: false,
    },
    done: {
        bg: 'bg-[#06d6a0]/5',
        border: 'border-[#06d6a0]/20',
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
            if (nextStatus === 'done') {
                openStatusModal(task.id);
            } else {
                setIsAnimating(true);
                await updateTaskStatus(task.id, nextStatus);
                setTimeout(() => setIsAnimating(false), 500);
            }
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

    const handleRestore = async () => {
        closeContextMenu();
        await updateTaskStatus(task.id, 'default');
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
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={handleTaskClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={() => { setShowMenu(false); if (isMenuOpen) closeContextMenu(); }}
            className={cn(
                'group relative p-4 rounded-2xl transition-all cursor-pointer border',
                'hover:shadow-lg hover:border-border/50 hover:bg-bg-secondary/80',
                'active:scale-[0.99] active:shadow-sm',
                config.bg,
                config.border,
                task.status === 'done' && 'opacity-60 hover:opacity-100',
                task.priority && 'ring-1 ring-[#ffbe0b]/50 shadow-[0_0_15px_-3px_rgba(255,190,11,0.15)]'
            )}
        >
            <div className="flex items-start gap-4">
                {/* Status Icon Button */}
                <motion.button
                    onClick={handleIconClick}
                    className="flex-shrink-0 mt-0.5 relative z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <motion.div
                        animate={config.pulse ? 'animate' : undefined}
                        variants={pulseGreen}
                        className={cn(
                            'w-10 h-10 flex items-center justify-center rounded-xl',
                            'transition-all duration-300 shadow-sm',
                            config.iconBg,
                            config.iconColor
                        )}
                    >
                        <Icon className="w-5 h-5" strokeWidth={2.5} />
                    </motion.div>
                </motion.button>

                {/* Task Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <motion.h3
                        layout
                        className={cn(
                            'text-lg font-semibold text-text-primary leading-tight mb-1',
                            task.status === 'done' && 'line-through text-text-secondary'
                        )}
                    >
                        {task.title}
                    </motion.h3>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Date & Time if Scheduled */}
                        {task.calendarSlot && task.calendarSlot.date && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 text-accent rounded-lg text-xs font-semibold tracking-wide">
                                <Clock className="w-3 h-3" />
                                {formatShortDate(new Date(task.calendarSlot.date + 'T00:00:00'))} • {formatTime(task.calendarSlot.startTime)} - {formatTime(task.calendarSlot.endTime)}
                            </span>
                        )}

                        {/* Goal badge */}
                        {task.goalId && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#8338ec]/10 text-[#8338ec] rounded-lg text-xs font-semibold tracking-wide">
                                <Target className="w-3 h-3" />
                                Goal linked
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex flex-col items-end gap-2">
                    {/* Priority Star - only for non-completed tasks */}
                    {task.status !== 'done' && (
                        <motion.button
                            onClick={handlePriorityToggle}
                            whileHover={{ scale: 1.2, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 rounded-full hover:bg-bg-tertiary transition-colors"
                        >
                            <Star
                                className={cn(
                                    'w-5 h-5 transition-all duration-300',
                                    task.priority
                                        ? 'fill-[#ffbe0b] text-[#ffbe0b] drop-shadow-[0_0_8px_rgba(255,190,11,0.5)]'
                                        : 'text-text-secondary/30 hover:text-[#ffbe0b]/50'
                                )}
                            />
                        </motion.button>
                    )}

                    {/* 3-Dot Menu - now shows for ALL tasks including completed */}
                    <AnimatePresence>
                        {(showMenu || isMenuOpen) && (
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
                                    className="p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>

                                <AnimatePresence>
                                    {isMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-1 w-36 bg-bg-primary border border-border/50 rounded-xl shadow-xl z-50 overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Restore option for completed tasks */}
                                            {task.status === 'done' && (
                                                <button
                                                    onClick={handleRestore}
                                                    className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-accent hover:bg-accent/10 transition-colors font-medium"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                    Restore
                                                </button>
                                            )}
                                            <button
                                                onClick={handleDelete}
                                                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors font-medium"
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
                </div>
            </div>

            {/* Progress Bar for Started Tasks */}
            {task.status === 'started' && (
                <motion.div
                    layoutId={`progress-${task.id}`}
                    className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#ffbe0b]/30 rounded-full overflow-hidden"
                >
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-1/2 h-full bg-[#ffbe0b]"
                    />
                </motion.div>
            )}
        </motion.div>
    );
}
