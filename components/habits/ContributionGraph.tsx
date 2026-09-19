'use client';

import React from 'react';
import { parseDateKey } from '@/lib/habits/logic';
import { formatDateKey, subDays } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

export interface ContributionGraphProps {
    color: string;
    checkIns: Record<string, 1 | 2>;
    days: string[];
    cell?: number;
    className?: string;
}

export function rollingDays(todayKey: string, count = 35): string[] {
    const today = parseDateKey(todayKey);
    const days: string[] = [];
    for (let i = count - 1; i >= 0; i--) {
        days.push(formatDateKey(subDays(today, i)));
    }
    return days;
}

export function ContributionGraph({
    color,
    checkIns,
    days,
    cell = 10,
    className,
}: ContributionGraphProps) {
    return (
        <div
            aria-hidden="true"
            className={cn('flex flex-wrap items-center gap-[3px]', className)}
        >
            {days.map((dateKey) => {
                const level = checkIns[dateKey];
                const hasLevel = level === 1 || level === 2;

                return (
                    <div
                        key={dateKey}
                        title={`${dateKey}${level === 2 ? ' (Full)' : level === 1 ? ' (Partial)' : ' (Empty)'}`}
                        className={cn(
                            'rounded-[2px] transition-colors shrink-0',
                            !hasLevel && 'bg-bg-tertiary opacity-80'
                        )}
                        style={{
                            width: `${cell}px`,
                            height: `${cell}px`,
                            ...(hasLevel
                                ? {
                                      backgroundColor: color,
                                      opacity: level === 2 ? 1 : 0.4,
                                  }
                                : {}),
                        }}
                    />
                );
            })}
        </div>
    );
}
