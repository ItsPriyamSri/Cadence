'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
    Circle, Play, Pause, Check, Clock, Target, Star,
    MoreVertical, Trash2, RotateCcw, Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Task } from '@/lib/firebase/firestore';
import { updateTaskStatus, getNextStatus, updateTask } from '@/lib/actions/tasks';
import { useAppStore } from '@/lib/store/app';
import { formatShortDate, formatTime } from '@/lib/utils/dates';

interface TaskCardProps {
    task: Task;
}

const statusConfig = {
    default: { stripe: 'var(--border-strong)', iconBg: 'bg-bg-secondary', iconColor: 'text-text-tertiary', Icon: Circle },
    started: { stripe: 'var(--started)', iconBg: 'bg-started-bg', iconColor: 'text-started', Icon: Play },
    paused: { stripe: 'var(--paused)', iconBg: 'bg-paused-bg', iconColor: 'text-paused', Icon: Pause },
    done: { stripe: 'var(--done)', iconBg: 'bg-done-bg', iconColor: 'text-done', Icon: Check },
} as const;

export function TaskCard({ task }: TaskCardProps) {
    const config = statusConfig[task.status];
    const Icon = config.Icon;
    const { openStatusModal, openTaskForm, contextMenuTaskId, openContextMenu, closeContextMenu, openDeleteConfirm, triggerConfetti } = useAppStore();
    const menuRef = useRef<HTMLDivElement>(null);
    const isMenuOpen = contextMenuTaskId === task.id;
    const isDone = task.status === 'done';
    const isStarted = task.status === 'started';

    useEffect(() => {
        if (!isMenuOpen) return;
        const handler = (e: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeContextMenu();
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [isMenuOpen, closeContextMenu]);

    // Swipe: right = complete, left = delete. Guards the tap so a swipe doesn't also toggle status.
    const SWIPE_THRESHOLD = 110;
    const x = useMotionValue(0);
    const completeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
    const swipedRef = useRef(false);

    const handleSwipeEnd = (_: unknown, info: PanInfo) => {
        if (Math.abs(info.offset.x) > 12) swipedRef.current = true;
        if (info.offset.x > SWIPE_THRESHOLD && !isDone) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
            updateTaskStatus(task.id, 'done').then(() => triggerConfetti());
        } else if (info.offset.x < -SWIPE_THRESHOLD) {
            openDeleteConfirm(task.id);
        }
    };

    const handleCardClick = async () => {
        if (swipedRef.current) { swipedRef.current = false; return; }
        if (isDone || isMenuOpen) return;
        const next = getNextStatus(task.status);
        if (next) await updateTaskStatus(task.id, next);
    };

    // Play button: tap = play/pause toggle, hold = open the 4-option status menu.
    const longPressRef = useRef(false);
    const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelPress = () => {
        if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
    };
    useEffect(() => cancelPress, []);

    const handleIconPressStart = (e: React.PointerEvent) => {
        e.stopPropagation();
        longPressRef.current = false;
        pressTimerRef.current = setTimeout(() => {
            longPressRef.current = true;
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(25);
            openStatusModal(task.id);
        }, 450);
    };

    const handleIconClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        cancelPress();
        if (longPressRef.current) { longPressRef.current = false; return; }
        const next = getNextStatus(task.status);
        if (next) updateTaskStatus(task.id, next);
    };

    const handleStar = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateTask(task.id, { priority: !task.priority });
    };

    const handleMenuToggle = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        isMenuOpen ? closeContextMenu() : openContextMenu(task.id);
    };

    const handleEdit = () => { closeContextMenu(); openTaskForm(task.id); };
    const handleDelete = () => { openDeleteConfirm(task.id); };
    const handleRestore = () => { closeContextMenu(); updateTaskStatus(task.id, 'default'); };

    const hasChips = !!(task.calendarSlot?.date || task.goalId);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className={cn('relative', isMenuOpen && 'z-20')}
        >
            {/* Swipe backdrops */}
            {!isDone && (
                <motion.div style={{ opacity: completeOpacity }} className="absolute inset-0 rounded-lg bg-done flex items-center justify-start pl-5 gap-2 pointer-events-none">
                    <Check className="w-5 h-5 text-white" strokeWidth={2.6} />
                    <span className="text-sm font-bold text-white">Complete</span>
                </motion.div>
            )}
            <motion.div style={{ opacity: deleteOpacity }} className="absolute inset-0 rounded-lg bg-danger flex items-center justify-end pr-5 gap-2 pointer-events-none">
                <span className="text-sm font-bold text-white">Delete</span>
                <Trash2 className="w-5 h-5 text-white" />
            </motion.div>

            <motion.div
                drag="x"
                style={{ x }}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={isDone ? { left: 0.7, right: 0 } : 0.7}
                onDragStart={() => { if (isMenuOpen) closeContextMenu(); }}
                onDragEnd={handleSwipeEnd}
                onClick={handleCardClick}
                className={cn(
                    'group relative flex items-start gap-3 p-4 pl-5 rounded-lg cursor-pointer touch-pan-y',
                    'bg-bg-primary border border-border shadow-elev-1',
                    'transition-shadow duration-200 hover:shadow-elev-2',
                    isStarted && 'ring-1 ring-[color-mix(in_srgb,var(--started)_45%,transparent)]',
                    isDone && 'opacity-60',
                    task.priority && !isDone && 'ring-1 ring-[color-mix(in_srgb,var(--priority)_50%,transparent)]'
                )}
            >
            {/* Status stripe */}
            <span
                className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                style={{ background: config.stripe }}
            />

            {/* Status icon button */}
            <button
                onClick={handleIconClick}
                onPointerDown={handleIconPressStart}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onContextMenu={(e) => e.preventDefault()}
                aria-label="Toggle status; hold for more options"
                className={cn(
                    'relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95',
                    config.iconBg, config.iconColor
                )}
            >
                {isStarted && (
                    <span
                        className="absolute inset-0 rounded-full animate-cad-glow"
                        style={{ boxShadow: '0 0 0 3px var(--started-bg), 0 0 14px var(--started)' }}
                    />
                )}
                <Icon className="relative w-5 h-5" strokeWidth={isDone || isStarted ? 2.6 : 2} fill={isStarted ? 'currentColor' : 'none'} />
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
                <div className={cn(
                    'text-base font-semibold leading-snug text-text-primary',
                    isDone && 'line-through text-text-secondary'
                )}>
                    {task.title}
                </div>

                {hasChips && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {task.calendarSlot?.date && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-bg-secondary text-text-secondary text-xs font-medium">
                                <Clock className="w-3 h-3" />
                                {formatShortDate(new Date(task.calendarSlot.date + 'T00:00:00'))} · {formatTime(task.calendarSlot.startTime)}
                            </span>
                        )}
                        {task.goalId && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent-subtle text-accent text-xs font-medium">
                                <Target className="w-3 h-3" />
                                Goal
                            </span>
                        )}
                    </div>
                )}

                {isStarted && (
                    <div className="relative h-[3px] mt-2.5 rounded-full bg-started-bg overflow-hidden">
                        <span className="absolute inset-y-0 w-2/5 rounded-full animate-cad-shimmer bg-[linear-gradient(90deg,transparent,var(--started),transparent)]" />
                    </div>
                )}
            </div>

            {/* Actions */}
            {!isDone && (
                <button
                    onClick={handleStar}
                    aria-label="Toggle priority"
                    className={cn(
                        'shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-bg-secondary',
                        task.priority ? 'text-priority' : 'text-text-tertiary hover:text-priority'
                    )}
                >
                    <Star className="w-[19px] h-[19px]" fill={task.priority ? 'currentColor' : 'none'} strokeWidth={1.8} />
                </button>
            )}

            <div className="relative shrink-0" ref={menuRef}>
                <button
                    onClick={handleMenuToggle}
                    onTouchEnd={handleMenuToggle}
                    aria-label="More actions"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-secondary transition-colors"
                >
                    <MoreVertical className="w-[19px] h-[19px]" />
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 4 }}
                            transition={{ duration: 0.16 }}
                            className="absolute right-0 top-11 z-30 min-w-[158px] p-1.5 rounded-md bg-bg-primary border border-border shadow-elev-4"
                        >
                            {isDone ? (
                                <MenuItem onClick={handleRestore} icon={<RotateCcw className="w-4 h-4" />} label="Restore" className="text-accent hover:bg-accent-subtle" />
                            ) : (
                                <MenuItem onClick={handleEdit} icon={<Pencil className="w-4 h-4" />} label="Edit" className="text-text-primary hover:bg-bg-secondary" />
                            )}
                            <MenuItem onClick={handleDelete} icon={<Trash2 className="w-4 h-4" />} label="Delete" className="text-danger hover:bg-danger-bg" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            </motion.div>
        </motion.div>
    );
}

function MenuItem({ onClick, icon, label, className }: { onClick: () => void; icon: React.ReactNode; label: string; className?: string }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm font-semibold transition-colors', className)}
        >
            {icon}{label}
        </button>
    );
}
