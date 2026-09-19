'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Task, CheckInLevel } from '@/lib/firebase/firestore';
import { completeHabit, setCheckInLevel, undoTodayCheckIn } from '@/lib/actions/habits';
import { formatDateKey } from '@/lib/utils/dates';
import { useAppStore } from '@/lib/store/app';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface IntensityChooserProps {
    isOpen: boolean;
    onClose: () => void;
    habit: Task;
    dateKey?: string; // default today
}

export function IntensityChooser({
    isOpen,
    onClose,
    habit,
    dateKey,
}: IntensityChooserProps) {
    const todayKey = dateKey || formatDateKey(new Date());
    const { triggerConfetti } = useAppStore();
    const [submitting, setSubmitting] = useState(false);

    const habitColor = habit.color || '#3b82f6';
    const currentLevel = habit.checkIns[todayKey];
    const isAlreadyRolled = habit.dueDate !== null && habit.dueDate > todayKey;

    const handleSelect = async (level: CheckInLevel) => {
        setSubmitting(true);
        try {
            if (isAlreadyRolled) {
                await setCheckInLevel(habit.id, todayKey, level);
            } else {
                await completeHabit(habit.id, level);
                if (level === 2) {
                    triggerConfetti();
                }
            }
            onClose();
        } catch (error) {
            console.error('Failed to log habit intensity:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClear = async () => {
        setSubmitting(true);
        try {
            await undoTodayCheckIn(habit.id);
            onClose();
        } catch (error) {
            console.error('Failed to undo today’s check-in:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="How did today go?"
            className="max-w-sm"
        >
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                    <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: habitColor }}
                    />
                    <span className="text-base font-semibold text-text-primary truncate">
                        {habit.title}
                    </span>
                </div>

                <p className="text-sm text-text-secondary">
                    {isAlreadyRolled
                        ? 'Update today’s intensity. Your streak and schedule will stay intact.'
                        : 'Choose your effort for today. Partial still keeps your momentum alive.'}
                </p>

                <div className="flex gap-3 mt-1">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSelect(1)}
                        className={cn(
                            'flex-1 min-h-[44px] py-3 px-4 rounded-md border text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
                            currentLevel === 1
                                ? 'border-accent ring-2 ring-accent/30'
                                : 'border-border'
                        )}
                        style={{
                            backgroundColor: `color-mix(in srgb, ${habitColor} 20%, transparent)`,
                            color: 'var(--text-primary)',
                        }}
                    >
                        <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: habitColor, opacity: 0.6 }}
                        />
                        Partial
                    </button>

                    <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleSelect(2)}
                        className={cn(
                            'flex-1 min-h-[44px] py-3 px-4 rounded-md text-sm font-semibold flex items-center justify-center gap-2 text-white shadow-md transition-all active:scale-[0.98]',
                            currentLevel === 2 ? 'ring-2 ring-white/50' : ''
                        )}
                        style={{
                            backgroundColor: habitColor,
                        }}
                    >
                        <Check className="w-4 h-4" strokeWidth={2.6} />
                        Full
                    </button>
                </div>

                {currentLevel && (
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={handleClear}
                        className="w-full min-h-[44px] py-2.5 rounded-md text-sm font-semibold text-text-secondary hover:text-danger hover:bg-danger-bg transition-colors disabled:opacity-60"
                    >
                        Clear today
                    </button>
                )}
            </div>
        </Modal>
    );
}
