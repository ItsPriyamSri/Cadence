'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { ChevronLeft, Play, Pause, Check } from 'lucide-react';
import { useActiveTasks } from '@/lib/hooks/useTasks';
import { useAppStore } from '@/lib/store/app';
import { updateTaskStatus } from '@/lib/actions/tasks';
import { useDisplayedElapsed } from './useDisplayedElapsed';
import { formatElapsed } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

export function FocusOverlay() {
    const { focusOpen, closeFocus, triggerConfetti } = useAppStore();
    const { activeTasks } = useActiveTasks();
    const activeTask = activeTasks[0];
    const seconds = useDisplayedElapsed(activeTask);
    const dragControls = useDragControls();

    const isRunning = activeTask?.status === 'started';
    const isOpen = focusOpen && !!activeTask;

    // Body scroll lock
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Screen Wake Lock API
    useEffect(() => {
        if (!isOpen) return;
        let sentinel: any = undefined;
        const req = async () => {
            try {
                if ('wakeLock' in navigator) {
                    sentinel = await (navigator as any).wakeLock.request('screen');
                }
            } catch {
                /* unsupported or permission denied */
            }
        };
        req();
        const onVis = () => {
            if (document.visibilityState === 'visible') req();
        };
        document.addEventListener('visibilitychange', onVis);
        return () => {
            document.removeEventListener('visibilitychange', onVis);
            try {
                sentinel?.release?.();
            } catch {
                /* ignore */
            }
        };
    }, [isOpen]);

    const handleDragEnd = (_: unknown, info: PanInfo) => {
        if (info.offset.y > 120 || info.velocity.y > 600) {
            closeFocus();
        }
    };

    const handleTogglePause = async () => {
        if (!activeTask) return;
        const newStatus = isRunning ? 'paused' : 'started';
        await updateTaskStatus(activeTask.id, newStatus);
    };

    const handleComplete = async () => {
        if (!activeTask) return;
        await updateTaskStatus(activeTask.id, 'done');
        triggerConfetti();
        closeFocus();
    };

    return (
        <AnimatePresence>
            {isOpen && activeTask && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    drag="y"
                    dragControls={dragControls}
                    dragListener={false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 0.6 }}
                    onDragEnd={handleDragEnd}
                    className="fixed inset-0 z-50 flex flex-col bg-bg-primary text-text-primary"
                >
                    {/* Grab handle — drag down to dismiss */}
                    <div
                        onPointerDown={(e) => dragControls.start(e)}
                        className="shrink-0 flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
                        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
                    >
                        <span className="w-10 h-1.5 rounded-full bg-border-strong" />
                    </div>

                    {/* Top bar */}
                    <div className="shrink-0 flex items-center justify-between px-4 pb-3 border-b border-border pt-1.5">
                        <button
                            onClick={closeFocus}
                            className="flex items-center gap-1 py-2 pr-2 text-accent text-base font-semibold transition-transform active:scale-95"
                        >
                            <ChevronLeft className="w-[22px] h-[22px]" strokeWidth={2.2} /> Tasks
                        </button>

                        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                            <span
                                className={cn(
                                    'w-2 h-2 rounded-full',
                                    isRunning ? 'bg-started animate-cad-live' : 'bg-paused'
                                )}
                            />
                            {isRunning ? 'Focusing' : 'Paused'}
                        </div>

                        <div className="w-16" />
                    </div>

                    {/* Main content: Title + Timer Ring */}
                    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
                        {/* Task Title */}
                        <div className="text-center max-w-sm px-4">
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary line-clamp-2">
                                {activeTask.title}
                            </h2>
                        </div>

                        {/* Interactive Timer Ring */}
                        <button
                            type="button"
                            onClick={handleTogglePause}
                            aria-label={isRunning ? 'Pause timer' : 'Resume timer'}
                            className="relative flex flex-col items-center justify-center rounded-full transition-transform active:scale-95 cursor-pointer shadow-elev-3"
                            style={{
                                width: 'min(72vw, 300px)',
                                height: 'min(72vw, 300px)',
                                borderWidth: '10px',
                                borderStyle: 'solid',
                                borderColor: isRunning ? 'var(--started)' : 'var(--paused)',
                                backgroundColor: isRunning ? 'var(--started-bg)' : 'var(--paused-bg)',
                            }}
                        >
                            <span className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight font-mono text-text-primary">
                                {formatElapsed(seconds)}
                            </span>
                            <span className="mt-2 text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1">
                                {isRunning ? (
                                    <>
                                        <Pause className="w-3 h-3" /> Tap to pause
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-3 h-3" fill="currentColor" /> Tap to resume
                                    </>
                                )}
                            </span>
                        </button>
                    </div>

                    {/* Bottom Action Bar */}
                    <div
                        className="shrink-0 p-6 flex gap-3 border-t border-border bg-bg-primary"
                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
                    >
                        <button
                            type="button"
                            onClick={handleTogglePause}
                            className="flex-1 min-h-[50px] py-3.5 px-4 rounded-xl border border-border bg-bg-secondary text-text-primary text-base font-semibold flex items-center justify-center gap-2 hover:bg-bg-tertiary transition-transform active:scale-98"
                        >
                            {isRunning ? (
                                <>
                                    <Pause className="w-5 h-5" /> Pause
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" fill="currentColor" /> Resume
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleComplete}
                            className="flex-[1.4] min-h-[50px] py-3.5 px-4 rounded-xl bg-done text-white text-base font-semibold flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(47,224,166,0.35)] hover:brightness-105 transition-transform active:scale-98"
                        >
                            <Check className="w-5 h-5" strokeWidth={2.6} /> Complete
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
