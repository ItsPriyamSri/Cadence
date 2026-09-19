'use client';

import React from 'react';
import { parseDateKey } from '@/lib/habits/logic';
import { formatDateKey, subDays } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';

export interface ContributionGraphProps {
    color: string;
    checkIns: Record<string, 1 | 2>;
    days: string[];
    columns?: number;
    className?: string;
}

export const GRAPH_COLS = 30;
export const GRAPH_ROWS = 3;
export const GRAPH_DAYS = GRAPH_COLS * GRAPH_ROWS;

export function rollingDays(todayKey: string, count = GRAPH_DAYS): string[] {
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
    className,
    columns = GRAPH_COLS,
}: ContributionGraphProps) {
    return (
        <div
            aria-hidden="true"
            className={cn('grid w-full gap-1', className)}
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
            {days.map((dateKey) => {
                const level = checkIns[dateKey];
                const hasLevel = level === 1 || level === 2;

                return (
                    <div
                        key={dateKey}
                        title={`${dateKey}${level === 2 ? ' (Full)' : level === 1 ? ' (Partial)' : ' (Empty)'}`}
                        className={cn(
                            'aspect-square rounded-[3px] transition-colors',
                            !hasLevel && 'bg-bg-tertiary'
                        )}
                        style={
                            hasLevel
                                ? { backgroundColor: color, opacity: level === 2 ? 1 : 0.42 }
                                : undefined
                        }
                    />
                );
            })}
        </div>
    );
}
