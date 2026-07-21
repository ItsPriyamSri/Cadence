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

const statusColors = {
    scheduled: { bg: 'bg-accent-subtle', border: 'var(--accent)', text: 'text-accent', dot: 'bg-accent' },
    active: { bg: 'bg-started-bg', border: 'var(--started)', text: 'text-started', dot: 'bg-started' },
    completed: { bg: 'bg-done-bg', border: 'var(--done)', text: 'text-done', dot: 'bg-done' },
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
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClick}
            style={{ ...style, borderLeftColor: colors.border }}
            className={cn(
                'relative rounded-md border-l-[3px] px-3 py-2 overflow-hidden h-full shadow-elev-1',
                'cursor-pointer active:scale-[0.98] hover:shadow-elev-2 transition-shadow',
                colors.bg,
                event.status === 'completed' && 'opacity-60',
                isDraggable && 'cursor-grab active:cursor-grabbing'
            )}
        >
            <div className="flex items-center gap-1.5 h-full">
                {isDraggable && <GripVertical className="w-3 h-3 text-text-tertiary shrink-0" />}
                <motion.span
                    animate={event.status === 'active' ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : undefined}
                    transition={event.status === 'active' ? { duration: 1.5, repeat: Infinity } : undefined}
                    className={cn('w-2 h-2 rounded-full shrink-0', colors.dot)}
                />
                <span className={cn(
                    'text-sm font-semibold truncate flex-1 min-w-0',
                    event.status === 'completed' ? 'line-through text-text-secondary' : 'text-text-primary'
                )}>
                    {event.title}
                </span>
                <span className={cn('text-[11px] font-medium whitespace-nowrap shrink-0', colors.text)}>
                    {formatTime(event.startTime)}–{formatTime(event.endTime)}
                </span>
            </div>
        </motion.div>
    );
}
