'use client';

import React, { useState, useRef, useEffect } from 'react';
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
        bg: 'bg-bg-tertiary shadow-soft',
        border: 'border border-transparent',
        hoverBorder: 'hover:shadow-elevated hover:border-border/30',
        icon: Circle,
        iconColor: 'text-text-secondary/60 hover:text-accent transition-colors',
        iconBg: 'bg-bg-secondary',
        pulse: false,
    },
    started: {
        bg: 'bg-warning/5 dark:bg-warning/10 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-2 ring-warning/50 animate-pulse-soft',
        border: 'border border-warning/30',
        hoverBorder: 'hover:border-warning/50 hover:shadow-elevated',
        icon: Play,
        iconColor: 'text-warning',
        iconBg: 'bg-warning/10',
        pulse: true,
    },
    paused: {
        bg: 'bg-bg-tertiary/80 shadow-sm',
        border: 'border border-transparent',
        hoverBorder: 'hover:border-border/30',
        icon: Pause,
        iconColor: 'text-text-secondary/60',
        iconBg: 'bg-bg-secondary',
        pulse: false,
    },
    done: {
        bg: 'bg-bg-secondary/20 shadow-none',
        border: 'border border-transparent',
        hoverBorder: 'hover:border-border/20',
        icon: CheckCircle,
        iconColor: 'text-success',
        iconBg: 'bg-success/10',
        pulse: false,
    },
};

export function TaskCard({ task }: TaskCardProps) {
    const config = statusConfig[task.status];
    const Icon = config.icon;
    const { openStatusModal, openTaskForm, contextMenuTaskId, openContextMenu, closeContextMenu } = useAppStore();
    const menuRef = useRef<HTMLDivElement>(null);
    const [showDots, setShowDots] = useState(false);

    const isMenuOpen = contextMenuTaskId === task.id;

    // Close menu on outside click/touch
    useEffect(() => {
        if (!isMenuOpen) return;
        const handler = (e: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                closeContextMenu();
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [isMenuOpen, closeContextMenu]);

    const handleTaskClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (task.status === 'done') return;
        if (isMenuOpen) return; // Don't cycle status if menu is open

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

    const handleMenuToggle = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        isMenuOpen ? closeContextMenu() : openContextMenu(task.id);
    };

    return (
        <div
            onClick={handleTaskClick}
            onMouseEnter={() => setShowDots(true)}
            onMouseLeave={() => { setShowDots(false); if (isMenuOpen) closeContextMenu(); }}
            className={cn(
                'group relative p-4 rounded-3xl cursor-pointer',
                'transition-all duration-300 ease-out',
                'active:scale-[0.98]',
                config.bg,
                config.border,
                config.hoverBorder,
                task.status === 'done' && 'opacity-60 hover:opacity-80',
                task.priority && 'ring-2 ring-warning/30',
                isMenuOpen && 'z-50'
            )}
        >
            <div className="flex items-start gap-3">
                {/* Status Icon Button */}
                <button
                    onClick={handleIconClick}
                    className={cn(
                        'flex-shrink-0 mt-0.5 w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl relative',
                        'flex items-center justify-center',
                        'transition-all duration-200',
                        'active:scale-95',
                        config.iconBg,
                        config.iconColor
                    )}
                >
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                    {config.pulse && (
                        <span className="absolute inset-0 rounded-xl bg-warning/40 animate-ping" style={{ animationDuration: '2s' }} />
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
                        {task.calendarSlot && task.calendarSlot.date && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-[#5fa8d3]/10 text-[#5fa8d3] rounded-lg text-xs font-medium">
                                <Clock className="w-3 h-3" />
                                {formatShortDate(new Date(task.calendarSlot.date + 'T00:00:00'))} • {formatTime(task.calendarSlot.startTime)}
                            </span>
                        )}

                        {task.goalId && (
                            <span className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 text-accent rounded-lg text-xs font-medium">
                                <Target className="w-3 h-3" />
                                Goal
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Side Actions - always visible */}
                <div className="flex items-center gap-1" ref={menuRef}>
                    {/* Priority Star */}
                    {task.status !== 'done' && (
                        <button
                            onClick={handlePriorityToggle}
                            className={cn(
                                'p-2 rounded-lg transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center hover:bg-bg-secondary',
                                task.priority
                                    ? 'text-warning'
                                    : 'text-text-secondary/30 hover:text-warning/70'
                            )}
                        >
                            <Star className={cn('w-5 h-5', task.priority && 'fill-warning text-warning')} />
                        </button>
                    )}

                    {/* 3-Dot Menu - visible on hover or when menu is open */}
                    <div className="relative">
                        {(showDots || isMenuOpen) && (
                            <>
                                <button
                                    onClick={handleMenuToggle}
                                    onTouchEnd={handleMenuToggle}
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
                                            className="absolute right-0 top-full mt-1 w-40 bg-bg-primary border border-border rounded-xl shadow-2xl z-[100] overflow-hidden"
                                        >
                                            {task.status === 'done' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRestore(); }}
                                                    className="w-full px-4 py-3.5 flex items-center gap-3 text-sm text-accent hover:bg-accent/10 transition-colors font-medium"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                    Restore
                                                </button>
                                            )}
                                            {task.status !== 'done' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                                                    className="w-full px-4 py-3.5 flex items-center gap-3 text-sm text-text-primary hover:bg-bg-secondary transition-colors font-medium"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                    Edit
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                                className="w-full px-4 py-3.5 flex items-center gap-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors font-medium"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar for Started Tasks */}
            {task.status === 'started' && (
                <div className="absolute bottom-0 left-4 right-4 h-1 bg-warning/10 rounded-t-full overflow-hidden">
                    <motion.div
                        animate={{ x: ['-100%', '250%'] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1/2 h-full bg-gradient-to-r from-warning/0 via-warning to-warning/0 rounded-full"
                    />
                </div>
            )}
        </div>
    );
}
