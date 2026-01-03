'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils/cn';
import { CalendarEvent as CalendarEventType } from '@/lib/firebase/firestore';
import { CalendarEvent } from './CalendarEvent';
import { formatHour } from '@/lib/utils/dates';

interface TimeSlotProps {
    hour: number;
    date: string;
    events: CalendarEventType[];
    onEventClick: (event: CalendarEventType) => void;
}

export function TimeSlot({ hour, date, events, onEventClick }: TimeSlotProps) {
    // Use underscore separator to avoid conflict with date format dashes
    const droppableId = `${date}_${hour}`;

    const { setNodeRef, isOver } = useDroppable({
        id: droppableId,
        data: { date, hour },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'min-h-[72px] border-b border-border flex items-start relative transition-all duration-200',
                isOver && 'bg-[#3a86ff]/10 border-[#3a86ff]/30'
            )}
        >
            {/* Hour label */}
            <div className="w-16 flex-shrink-0 pr-3 pt-2 text-right sticky left-0 bg-bg-primary">
                <span className="text-xs font-medium text-text-secondary">{formatHour(hour)}</span>
            </div>

            {/* Events container */}
            <div className="flex-1 py-1 pr-2">
                {events.length > 0 ? (
                    events.map((event) => (
                        <CalendarEvent
                            key={event.id}
                            event={event}
                            onClick={() => onEventClick(event)}
                        />
                    ))
                ) : (
                    // Empty slot indicator when dragging over
                    isOver && (
                        <div className="h-14 border-2 border-dashed border-[#3a86ff]/50 rounded-xl flex items-center justify-center bg-[#3a86ff]/5">
                            <span className="text-xs font-medium text-[#3a86ff]">Drop here</span>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
