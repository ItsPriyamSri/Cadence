'use client';

import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '@/lib/firebase/firestore';
import { formatDateKey } from '@/lib/utils/dates';
import { IntensityChooser } from './IntensityChooser';
import { cn } from '@/lib/utils/cn';

interface HabitMonthCalendarProps {
    habit: Task;
}

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HabitMonthCalendar({ habit }: HabitMonthCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [todayChooserOpen, setTodayChooserOpen] = useState(false);

    const today = new Date();
    const todayKey = formatDateKey(today);
    const habitColor = habit.color || '#3b82f6';
    const habitStartedOn = habit.habitStartedOn || todayKey;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
        days.push(day);
        day = addDays(day, 1);
    }

    const prevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
    const nextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

    return (
        <div className="p-5 rounded-lg bg-bg-primary border border-border shadow-elev-1 flex flex-col gap-4">
            {/* Calendar header */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-text-primary">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={prevMonth}
                        aria-label="Previous month"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={nextMonth}
                        aria-label="Next month"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {WEEKDAY_LABELS.map((label, idx) => (
                    <div
                        key={idx}
                        className="text-xs font-semibold text-text-tertiary py-1"
                    >
                        {label}
                    </div>
                ))}
            </div>

            {/* Calendar days grid */}
            <div className="grid grid-cols-7 gap-1.5">
                {days.map((date) => {
                    const dateKey = formatDateKey(date);
                    const isCurrentMonth = isSameMonth(date, currentMonth);
                    const isTodayDate = isSameDay(date, today);
                    const isBeforeStart = dateKey < habitStartedOn;
                    const level = habit.checkIns[dateKey];
                    const hasCheckIn = level === 1 || level === 2;

                    if (!isCurrentMonth) {
                        return <div key={dateKey} className="aspect-square" />;
                    }

                    const isInteractive = isTodayDate && hasCheckIn;

                    return (
                        <button
                            type="button"
                            key={dateKey}
                            disabled={!isInteractive}
                            onClick={() => {
                                if (isInteractive) {
                                    setTodayChooserOpen(true);
                                }
                            }}
                            className={cn(
                                'aspect-square rounded-md flex flex-col items-center justify-center text-xs font-semibold relative transition-all',
                                isBeforeStart
                                    ? 'text-text-tertiary/40 bg-transparent'
                                    : !hasCheckIn
                                      ? 'text-text-secondary bg-bg-secondary/70 hover:bg-bg-secondary'
                                      : 'text-white',
                                isTodayDate && 'ring-2 ring-accent ring-offset-1 ring-offset-bg-primary',
                                isInteractive && 'cursor-pointer active:scale-95'
                            )}
                            style={
                                hasCheckIn && !isBeforeStart
                                    ? {
                                          backgroundColor: habitColor,
                                          opacity: level === 2 ? 1 : 0.45,
                                          color: level === 2 ? '#ffffff' : 'var(--text-primary)',
                                      }
                                    : {}
                            }
                        >
                            <span>{format(date, 'd')}</span>
                        </button>
                    );
                })}
            </div>

            <IntensityChooser
                isOpen={todayChooserOpen}
                onClose={() => setTodayChooserOpen(false)}
                habit={habit}
                dateKey={todayKey}
            />
        </div>
    );
}
