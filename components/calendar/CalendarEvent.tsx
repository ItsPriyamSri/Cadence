'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CalendarEvent as CalendarEventType } from '@/lib/firebase/firestore';
import { cn } from '@/lib/utils/cn';
import { formatTime } from '@/lib/utils/dates';

interface CalendarEventCardProps {
    event: CalendarEventType;
    onClick: () => void;
    style?: React.CSSProperties;
}

// Color config based on status
const statusColors = {
    scheduled: {
        bg: 'bg-[#3a86ff]/20',
        border: 'border-l-[#3a86ff]',
        text: 'text-[#3a86ff]',
        dot: 'bg-[#3a86ff]',
    },
    active: {
        bg: 'bg-[#ffbe0b]/20',
        border: 'border-l-[#ffbe0b]',
        text: 'text-[#ffbe0b]',
        dot: 'bg-[#ffbe0b]',
    },
    completed: {
        bg: 'bg-[#06d6a0]/20',
        border: 'border-l-[#06d6a0]',
        text: 'text-[#06d6a0]',
        dot: 'bg-[#06d6a0]',
    },
};

function getStatusColors(status: string) {
    if (status === 'active') return statusColors.active;
    if (status === 'completed') return statusColors.completed;
    return statusColors.scheduled;
}

export function CalendarEvent({ event, onClick, style }: CalendarEventCardProps) {
    const colors = getStatusColors(event.status);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClick}
            style={style}
            className={cn(
                'absolute left-16 right-2 rounded-xl border-l-4 px-3 py-2 transition-all overflow-hidden',
                'hover:shadow-lg cursor-pointer z-10',
                colors.bg,
                colors.border,
                event.status === 'completed' && 'opacity-70'
            )}
        >
            {/* Horizontal layout: title on left, time on right */}
            <div className="flex items-center justify-between gap-2 h-full">
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
                <div className="absolute inset-0 rounded-xl bg-[#ffbe0b]/5 animate-pulse pointer-events-none" />
            )}
        </motion.div>
    );
}
