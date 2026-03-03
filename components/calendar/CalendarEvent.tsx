'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { CalendarEvent as CalendarEventType } from '@/lib/firebase/firestore';
import { cn } from '@/lib/utils/cn';
import { formatTime } from '@/lib/utils/dates';

interface CalendarEventCardProps {
    event: CalendarEventType;
    onClick: () => void;
    style?: React.CSSProperties;
    isDraggable?: boolean;
}

// Softer color config based on semantic classes
const statusColors = {
    scheduled: {
        bg: 'bg-accent/15',
        border: 'border-l-accent',
        text: 'text-accent',
        dot: 'bg-accent',
    },
    active: {
        bg: 'bg-warning/15',
        border: 'border-l-warning',
        text: 'text-warning',
        dot: 'bg-warning',
    },
    completed: {
        bg: 'bg-success/15',
        border: 'border-l-success',
        text: 'text-success',
        dot: 'bg-success',
    },
};

function getStatusColors(status: string) {
    if (status === 'active') return statusColors.active;
    if (status === 'completed') return statusColors.completed;
    return statusColors.scheduled;
}

export function CalendarEvent({ event, onClick, style, isDraggable }: CalendarEventCardProps) {
    const colors = getStatusColors(event.status);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClick}
            style={style}
            className={cn(
                'rounded-2xl border-l-4 px-3 py-2 transition-all overflow-hidden h-full',
                'hover:shadow-lg cursor-pointer active:scale-[0.98]',
                colors.bg,
                colors.border,
                event.status === 'completed' && 'opacity-60',
                isDraggable && 'cursor-grab active:cursor-grabbing'
            )}
        >
            {/* Horizontal layout: drag handle, title, time */}
            <div className="flex items-center gap-2 h-full">
                {/* Drag handle indicator */}
                {isDraggable && (
                    <GripVertical className="w-3 h-3 text-text-secondary/40 flex-shrink-0" />
                )}

                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Status dot */}
                    <motion.div
                        animate={event.status === 'active' ? {
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.7, 1],
                        } : undefined}
                        transition={event.status === 'active' ? {
                            duration: 1.5,
                            repeat: Infinity,
                        } : undefined}
                        className={cn('w-2 h-2 rounded-full flex-shrink-0', colors.dot)}
                    />

                    <p className={cn(
                        'text-sm font-medium truncate',
                        event.status === 'completed' ? 'line-through text-text-secondary' : 'text-text-primary'
                    )}>
                        {event.title}
                    </p>
                </div>

                <span className={cn('text-xs font-medium whitespace-nowrap flex-shrink-0', colors.text)}>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </span>
            </div>

            {/* Active indicator glow */}
            {event.status === 'active' && (
                <div className="absolute inset-0 rounded-2xl bg-warning/5 animate-pulse pointer-events-none" />
            )}
        </motion.div>
    );
}
