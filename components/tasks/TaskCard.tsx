'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Circle, Play, Pause, CheckCircle, Clock, Target, Star,
    MoreVertical, Trash2, RotateCcw, Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Task } from '@/lib/firebase/firestore';
import { updateTaskStatus, getNextStatus, updateTask, deleteTask } from '@/lib/actions/tasks';
import { useAppStore } from '@/lib/store/app';
import { formatShortDate, formatTime } from '@/lib/utils/dates';

interface TaskCardProps {
    task: Task;
}

// UX Color System:
// - Default (new): Gray - neutral, waiting state
// - Started (ongoing): Yellow/Amber - active, in progress
// - Paused: Light Gray - on hold
// - Done: Green - completed, success
const statusConfig = {
    default: {
        bg: 'bg-bg-secondary/30',
        border: 'border-border/50',
        hoverBorder: 'hover:border-border',
        icon: Circle,
        iconColor: 'text-text-secondary/60',
        iconBg: 'bg-bg-tertiary',
        pulse: false,
    },
    started: {
        bg: 'bg-[#f4a261]/8',
        border: 'border-[#f4a261]/30',
        hoverBorder: 'hover:border-[#f4a261]/50',
        icon: Play,
        iconColor: 'text-[#f4a261]',
        iconBg: 'bg-[#f4a261]/15',
        pulse: true,
    },
    paused: {
        bg: 'bg-bg-secondary/40',
        border: 'border-border/70',
        hoverBorder: 'hover:border-border',
        icon: Pause,
        iconColor: 'text-text-secondary/70',
        iconBg: 'bg-bg-tertiary',
        pulse: false,
    },
    done: {
        bg: 'bg-[#4ecdc4]/5',
        border: 'border-[#4ecdc4]/20',
        hoverBorder: 'hover:border-[#4ecdc4]/40',
        icon: CheckCircle,
        iconColor: 'text-[#4ecdc4]',
        iconBg: 'bg-[#4ecdc4]/10',
        pulse: false,
    },
};

export function TaskCard({ task }: TaskCardProps) {
    const config = statusConfig[task.status];
    const Icon = config.icon;
    const { openStatusModal, openTaskForm, contextMenuTaskId, openContextMenu, closeContextMenu } = useAppStore();
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
                await updateTaskStatus(task.id, nextStatus);
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

    const handleEdit = () => {
        closeContextMenu();
        openTaskForm(task.id);
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
        <div
            onClick={handleTaskClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setShowMenu(true)}
            onMouseLeave={() => { setShowMenu(false); if (isMenuOpen) closeContextMenu(); }}
            className={cn(
                'group relative p-4 rounded-2xl cursor-pointer border',
                'transition-all duration-200 ease-out',
                'hover:shadow-md',
                'active:opacity-90',
                config.bg,
                config.border,
                config.hoverBorder,
                task.status === 'done' && 'opacity-60 hover:opacity-80',
                task.priority && 'ring-1 ring-[#4ecdc4]/40'
            )}
        >
            <div className="flex items-start gap-3">
                {/* Status Icon Button */}
                <button
                    onClick={handleIconClick}
                    className={cn(
                        'flex-shrink-0 mt-0.5 w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl',
                        'flex items-center justify-center',
                        'transition-all duration-200',
                        'active:scale-95',
                        config.iconBg,
                        config.iconColor
                    )}
                >
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                    {/* Pulse animation for started tasks */}
                    {config.pulse && (
                        <span className="absolute inset-0 rounded-xl bg-[#f4a261]/20 animate-ping" style={{ animationDuration: '2s' }} />
                    )}
                </button>

                {/* Task Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <h3
                        className={cn(
                            'text-base font-semibold text-text-primary leading-tight',
                            task.status === 'done' && 'line-through text-text-secondary'
                        )}
                    >
                        {task.title}
                    </h3>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Date & Time if Scheduled */}
                        {task.calendarSlot && task.calendarSlot.date && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-[#5fa8d3]/10 text-[#5fa8d3] rounded-lg text-xs font-medium">
                                <Clock className="w-3 h-3" />
                                {formatShortDate(new Date(task.calendarSlot.date + 'T00:00:00'))} • {formatTime(task.calendarSlot.startTime)}
                            </span>
                        )}

                        {/* Goal badge */}
                        {task.goalId && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-[#a8a4ce]/10 text-[#a8a4ce] rounded-lg text-xs font-medium">
                                <Target className="w-3 h-3" />
                                Goal
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-1">
                    {/* Priority Star - only for non-completed tasks */}
                    {task.status !== 'done' && (
                        <button
                            onClick={handlePriorityToggle}
                            className={cn(
                                'p-2 rounded-lg transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center',
                                task.priority
                                    ? 'text-[#4ecdc4]'
                                    : 'text-text-secondary/30 hover:text-[#4ecdc4]/70'
                            )}
                        >
                            <Star className={cn('w-5 h-5', task.priority && 'fill-current')} />
                        </button>
                    )}

                    {/* 3-Dot Menu */}
                    <AnimatePresence>
                        {(showMenu || isMenuOpen) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="relative"
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        isMenuOpen ? closeContextMenu() : openContextMenu(task.id);
                                    }}
                                    className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-text-primary min-w-[40px] min-h-[40px] flex items-center justify-center"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </button>

                                <AnimatePresence>
                                    {isMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-1 w-36 bg-bg-primary border border-border/50 rounded-xl shadow-xl z-50 overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Restore option for completed tasks */}
                                            {task.status === 'done' && (
                                                <button
                                                    onClick={handleRestore}
                                                    className="w-full px-4 py-3 flex items-center gap-3 text-sm text-accent hover:bg-accent/10 transition-colors font-medium"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                    Restore
                                                </button>
                                            )}
                                            {/* Edit option for non-completed tasks */}
                                            {task.status !== 'done' && (
                                                <button
                                                    onClick={handleEdit}
                                                    className="w-full px-4 py-3 flex items-center gap-3 text-sm text-text-primary hover:bg-bg-secondary transition-colors font-medium"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    Edit
                                                </button>
                                            )}
                                            <button
                                                onClick={handleDelete}
                                                className="w-full px-4 py-3 flex items-center gap-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors font-medium"
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
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#f4a261]/20 rounded-full overflow-hidden">
                    <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                        className="w-1/2 h-full bg-[#f4a261]"
                    />
                </div>
            )}
        </div>
    );
}
