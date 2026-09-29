'use client';

import React from 'react';
import { parseDateKey } from '@/lib/habits/logic';
import { addDays, formatDateKey } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

interface HabitStartFieldProps {
    value: string;
    todayKey: string;
    onChange: (next: string) => void;
}

const chipClass =
    'px-3 py-2.5 rounded-md border-[1.5px] text-sm font-semibold transition-colors shrink-0';

export function HabitStartField({ value, todayKey, onChange }: HabitStartFieldProps) {
    const tomorrowKey = formatDateKey(addDays(parseDateKey(todayKey), 1));

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">Starts</span>
            <div className="flex gap-1.5">
                <button
                    type="button"
                    onClick={() => onChange(todayKey)}
                    className={cn(
                        chipClass,
                        value === todayKey
                            ? 'border-accent bg-accent-subtle text-accent'
                            : 'border-border bg-bg-secondary text-text-secondary'
                    )}
                >
                    Today
                </button>
                <button
                    type="button"
                    onClick={() => onChange(tomorrowKey)}
                    className={cn(
                        chipClass,
                        value === tomorrowKey
                            ? 'border-accent bg-accent-subtle text-accent'
                            : 'border-border bg-bg-secondary text-text-secondary'
                    )}
                >
                    Tomorrow
                </button>
                <input
                    type="date"
                    min={value < todayKey ? undefined : todayKey}
                    value={value}
                    onChange={(e) => {
                        if (e.target.value) onChange(e.target.value);
                    }}
                    aria-label="Start date"
                    className="min-w-0 flex-1 box-border px-3 py-2.5 rounded-md border-[1.5px] border-border bg-bg-secondary text-text-primary text-sm font-[inherit] outline-none focus:border-accent"
                />
            </div>
        </div>
    );
}
