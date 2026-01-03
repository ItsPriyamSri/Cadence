'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, CalendarOff, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CalendarEvent } from '@/lib/firebase/firestore';
import { updateCalendarEvent, unscheduleTask, deleteCalendarEvent } from '@/lib/actions/calendar';
import { updateTask } from '@/lib/actions/tasks';
import { cn } from '@/lib/utils/cn';
import { format, addDays, subDays } from 'date-fns';

interface EventTimeEditorProps {
    event: CalendarEvent | null;
    isOpen: boolean;
    onClose: () => void;
}

// Generate time options in 15-minute intervals
function generateTimeOptions(): string[] {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const h = hour.toString().padStart(2, '0');
            const m = minute.toString().padStart(2, '0');
            options.push(`${h}:${m}`);
        }
    }
    return options;
}

const TIME_OPTIONS = generateTimeOptions();

function formatTimeDisplay(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function formatDateDisplay(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return format(date, 'EEE, MMM d');
}

// Generate next 14 days for date picker
function generateDateOptions(currentDate: string): string[] {
    const dates: string[] = [];
    const today = new Date();

    // Include 7 days before and 14 days after
    for (let i = -7; i <= 14; i++) {
        const date = addDays(today, i);
        dates.push(format(date, 'yyyy-MM-dd'));
    }

    // Make sure current date is included
    if (!dates.includes(currentDate)) {
        dates.push(currentDate);
        dates.sort();
    }

    return dates;
}

export function EventTimeEditor({ event, isOpen, onClose }: EventTimeEditorProps) {
    const [date, setDate] = useState(event?.date || format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState(event?.startTime || '09:00');
    const [endTime, setEndTime] = useState(event?.endTime || '10:00');
    const [isSaving, setIsSaving] = useState(false);
    const [isUnscheduling, setIsUnscheduling] = useState(false);

    React.useEffect(() => {
        if (event) {
            setDate(event.date);
            setStartTime(event.startTime);
            setEndTime(event.endTime);
        }
    }, [event]);

    const handleSave = async () => {
        if (!event) return;

        setIsSaving(true);
        try {
            // Update calendar event with new date and times
            await updateCalendarEvent(event.id, {
                date,
                startTime,
                endTime,
            });

            // If linked to a task, update the task's calendar slot
            if (event.taskId) {
                await updateTask(event.taskId, {
                    calendarSlot: {
                        date,
                        startTime,
                        endTime,
                        eventId: event.id,
                    },
                });
            }

            onClose();
        } catch (error) {
            console.error('Failed to update event:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUnschedule = async () => {
        if (!event || !event.taskId) return;

        setIsUnscheduling(true);
        try {
            await unscheduleTask(event.taskId, event.id);
            onClose();
        } catch (error) {
            console.error('Failed to unschedule task:', error);
        } finally {
            setIsUnscheduling(false);
        }
    };

    // Calculate duration in minutes
    const calculateDuration = (): string => {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        const duration = endMins - startMins;

        if (duration <= 0) return 'Invalid time range';

        const hours = Math.floor(duration / 60);
        const mins = duration % 60;

        if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        return `${mins} minutes`;
    };

    if (!event) return null;

    const dateOptions = generateDateOptions(event.date);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Schedule">
            <div className="p-4 space-y-5">
                {/* Event Title */}
                <div className="text-center pb-2 border-b border-border/50">
                    <p className="text-lg font-bold text-text-primary">{event.title}</p>
                </div>

                {/* Date Picker */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2">
                        <Calendar className="w-4 h-4" />
                        Date
                    </label>
                    <select
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={cn(
                            'w-full p-3 rounded-xl border border-border bg-bg-secondary',
                            'text-text-primary focus:outline-none focus:border-accent',
                            'transition-colors'
                        )}
                    >
                        {dateOptions.map((d) => (
                            <option key={d} value={d}>
                                {formatDateDisplay(d)}
                                {d === format(new Date(), 'yyyy-MM-dd') && ' (Today)'}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Time Pickers */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Start Time
                        </label>
                        <select
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className={cn(
                                'w-full p-3 rounded-xl border border-border bg-bg-secondary',
                                'text-text-primary focus:outline-none focus:border-accent',
                                'transition-colors'
                            )}
                        >
                            {TIME_OPTIONS.map((time) => (
                                <option key={`start-${time}`} value={time}>
                                    {formatTimeDisplay(time)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            End Time
                        </label>
                        <select
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className={cn(
                                'w-full p-3 rounded-xl border border-border bg-bg-secondary',
                                'text-text-primary focus:outline-none focus:border-accent',
                                'transition-colors'
                            )}
                        >
                            {TIME_OPTIONS.map((time) => (
                                <option key={`end-${time}`} value={time}>
                                    {formatTimeDisplay(time)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Duration Display */}
                <div className="flex items-center justify-center gap-2 p-3 bg-bg-secondary rounded-xl">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-text-primary">
                        Duration: {calculateDuration()}
                    </span>
                </div>

                {/* Quick Duration Buttons */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {[15, 30, 45, 60, 90, 120].map((mins) => (
                        <button
                            key={mins}
                            onClick={() => {
                                const [h, m] = startTime.split(':').map(Number);
                                const startMins = h * 60 + m;
                                const endMins = startMins + mins;
                                const endH = Math.floor(endMins / 60) % 24;
                                const endM = endMins % 60;
                                setEndTime(`${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`);
                            }}
                            className={cn(
                                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                                'bg-bg-tertiary hover:bg-accent/10 text-text-secondary hover:text-accent'
                            )}
                        >
                            {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                        </button>
                    ))}
                </div>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    loading={isSaving}
                    className="w-full"
                >
                    Save Changes
                </Button>

                {/* Unschedule Option - Only if linked to a task */}
                {event.taskId && (
                    <button
                        onClick={handleUnschedule}
                        disabled={isUnscheduling}
                        className={cn(
                            'w-full flex items-center justify-center gap-2 p-3 rounded-xl',
                            'text-red-500 hover:bg-red-500/10 transition-colors',
                            'text-sm font-medium',
                            isUnscheduling && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <CalendarOff className="w-4 h-4" />
                        {isUnscheduling ? 'Removing...' : 'Remove from Calendar'}
                    </button>
                )}
            </div>
        </Modal>
    );
}
