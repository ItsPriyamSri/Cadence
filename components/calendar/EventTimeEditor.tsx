'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CalendarEvent } from '@/lib/firebase/firestore';
import { updateCalendarEvent } from '@/lib/actions/calendar';
import { useTasksStore } from '@/lib/store/optimistic';
import { updateTask } from '@/lib/actions/tasks';
import { cn } from '@/lib/utils/cn';

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

export function EventTimeEditor({ event, isOpen, onClose }: EventTimeEditorProps) {
    const [startTime, setStartTime] = useState(event?.startTime || '09:00');
    const [endTime, setEndTime] = useState(event?.endTime || '10:00');
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if (event) {
            setStartTime(event.startTime);
            setEndTime(event.endTime);
        }
    }, [event]);

    const handleSave = async () => {
        if (!event) return;

        setIsSaving(true);
        try {
            // Update calendar event
            await updateCalendarEvent(event.id, {
                startTime,
                endTime,
            });

            // If linked to a task, update the task's calendar slot
            if (event.taskId) {
                await updateTask(event.taskId, {
                    calendarSlot: {
                        date: event.date,
                        startTime,
                        endTime,
                        eventId: event.id,
                    },
                });
            }

            onClose();
        } catch (error) {
            console.error('Failed to update event time:', error);
        } finally {
            setIsSaving(false);
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Time">
            <div className="p-4 space-y-6">
                {/* Event Title */}
                <div className="text-center">
                    <p className="text-lg font-semibold text-text-primary">{event.title}</p>
                    <p className="text-sm text-text-secondary mt-1">{event.date}</p>
                </div>

                {/* Time Pickers */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Start Time */}
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

                    {/* End Time */}
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

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        loading={isSaving}
                        className="flex-1"
                    >
                        Save
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
