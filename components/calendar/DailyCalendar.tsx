'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor,
    DragStartEvent,
    DragEndEvent,
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, GripVertical, X } from 'lucide-react';
import { ActiveTaskBanner } from './ActiveTaskBanner';
import { CalendarEvent } from './CalendarEvent';
import { EventTimeEditor } from './EventTimeEditor';
import { Button } from '@/components/ui/Button';
import { useCalendarEvents } from '@/lib/hooks/useCalendarEvents';
import { useTasks, useActiveTasks } from '@/lib/hooks/useTasks';
import { handleTaskDropOnCalendar, rescheduleEvent } from '@/lib/actions/calendar';
import { useAppStore } from '@/lib/store/app';
import { CalendarEvent as CalendarEventType, Task } from '@/lib/firebase/firestore';
import { generateHourSlots, formatDisplayDate, formatDateKey, formatHour, addDays, subDays, isToday as checkIsToday } from '@/lib/utils/dates';
import { fadeIn } from '@/lib/utils/animations';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

const HOUR_HEIGHT = 72; // Height of each hour slot in pixels

// Current time indicator component
function CurrentTimeIndicator({ startHour }: { startHour: number }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Update every minute
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const topPosition = ((totalMinutes - startHour * 60) / 60) * HOUR_HEIGHT;

    // Only show if within visible range
    if (hours < startHour || hours > 23) return null;

    return (
        <div
            className="absolute left-14 right-0 z-20 pointer-events-none"
            style={{ top: `${topPosition}px` }}
        >
            <div className="relative flex items-center">
                {/* Time label */}
                <div className="absolute -left-14 -top-2 text-[10px] font-bold text-[#ff6b6b] bg-[#ff6b6b]/10 px-1.5 py-0.5 rounded">
                    {format(currentTime, 'h:mm')}
                </div>
                {/* Dot */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b] shadow-[0_0_8px_rgba(255,107,107,0.6)] -ml-1" />
                {/* Line */}
                <div className="flex-1 h-[2px] bg-[#ff6b6b] shadow-[0_0_4px_rgba(255,107,107,0.4)]" />
            </div>
        </div>
    );
}

export function DailyCalendar() {
    const { selectedDate, setSelectedDate } = useAppStore();
    const dateKey = formatDateKey(selectedDate);
    const { events, loading } = useCalendarEvents(dateKey);
    const { tasks } = useTasks();
    const { activeTasks } = useActiveTasks();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [hasScrolled, setHasScrolled] = useState(false);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragType, setDragType] = useState<'task' | 'event' | null>(null);
    const [editingEvent, setEditingEvent] = useState<CalendarEventType | null>(null);

    const hours = useMemo(() => generateHourSlots(0, 23), []);
    const isToday = checkIsToday(selectedDate);
    const startHour = 0; // First hour displayed on calendar

    // Auto-scroll to current time on mount (only for today)
    useEffect(() => {
        if (isToday && !hasScrolled && scrollContainerRef.current) {
            const now = new Date();
            const currentHour = now.getHours();
            // Scroll to current hour minus 1 for context
            const scrollToHour = Math.max(0, currentHour - 1);
            const scrollPosition = scrollToHour * HOUR_HEIGHT;

            setTimeout(() => {
                scrollContainerRef.current?.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth',
                });
                setHasScrolled(true);
            }, 100);
        }
    }, [isToday, hasScrolled]);

    // Reset scroll flag when date changes
    useEffect(() => {
        setHasScrolled(false);
    }, [dateKey]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 8 },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        const data = event.active.data.current;
        setDragType(data?.type === 'event' ? 'event' : 'task');
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);
        setDragType(null);

        const { active, over } = event;
        if (!over) return;

        const overId = over.id as string;
        const lastUnderscoreIndex = overId.lastIndexOf('_');
        const dropDate = overId.substring(0, lastUnderscoreIndex);
        const dropHour = parseInt(overId.substring(lastUnderscoreIndex + 1), 10);

        const activeData = active.data.current;

        // Handle event rescheduling
        if (activeData?.type === 'event') {
            const eventToReschedule = events.find(e => e.id === active.id);
            if (eventToReschedule) {
                try {
                    await rescheduleEvent(eventToReschedule.id, dropDate, dropHour, eventToReschedule.taskId);
                } catch (error) {
                    console.error('Failed to reschedule event:', error);
                }
            }
            return;
        }

        // Handle new task scheduling
        const task = tasks.find((t) => t.id === active.id);
        if (task) {
            try {
                await handleTaskDropOnCalendar(task.id, task.title, dropDate, dropHour);
            } catch (error) {
                console.error('Failed to schedule task:', error);
            }
        }
    };

    // Calculate event position and height based on time
    const getEventStyle = (event: CalendarEventType): React.CSSProperties => {
        const [startH, startM] = event.startTime.split(':').map(Number);
        const [endH, endM] = event.endTime.split(':').map(Number);

        const startTotalMins = startH * 60 + startM;
        const endTotalMins = endH * 60 + endM;
        const durationMins = endTotalMins - startTotalMins;

        // Calculate top position relative to start hour
        const startOffset = (startH - startHour) * 60 + startM;
        const top = (startOffset / 60) * HOUR_HEIGHT + 4; // +4 for padding

        // Calculate height based on duration
        const height = Math.max(32, (durationMins / 60) * HOUR_HEIGHT - 8); // Min 32px, -8 for margins

        return {
            top: `${top}px`,
            height: `${height}px`,
        };
    };

    const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
    const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
    const goToToday = () => setSelectedDate(new Date());

    const unscheduledTasks = tasks.filter((t) => !t.calendarSlot && t.status !== 'done');
    const hasActiveTask = activeTasks.length > 0;

    if (loading && events.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="h-full flex flex-col relative"
            >
                {/* Floating Active Task Banner (Expandable Pill) */}
                <ActiveTaskBanner />

                {/* Date Navigation */}
                <div className={cn(
                    "sticky top-0 z-20 bg-bg-primary/90 backdrop-blur-lg border-b border-border transition-all",
                    hasActiveTask && "mt-12"
                )}>
                    <div className="flex items-center justify-between p-4">
                        <Button variant="ghost" size="sm" onClick={goToPreviousDay}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>

                        <div className="text-center">
                            <h2 className="text-lg font-bold text-text-primary">
                                {formatDisplayDate(selectedDate)}
                            </h2>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="text-xs text-text-secondary">
                                    {format(selectedDate, 'EEEE')}
                                </span>
                                {!isToday && (
                                    <button onClick={goToToday} className="text-xs text-accent font-medium hover:underline">
                                        Go to Today
                                    </button>
                                )}
                                {isToday && (
                                    <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full font-medium">
                                        Today
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button variant="ghost" size="sm" onClick={goToNextDay}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Time Grid with Overlapping Events */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-auto relative pb-36 md:pb-4"
                >
                    {/* Hour rows (background) */}
                    {hours.map((hour) => (
                        <HourRow key={hour} hour={hour} date={dateKey} activeId={activeId} />
                    ))}

                    {/* Current Time Indicator - only show today */}
                    {isToday && <CurrentTimeIndicator startHour={startHour} />}

                    {/* Events overlaid on top - now draggable */}
                    {events.map((event) => (
                        <DraggableEvent
                            key={event.id}
                            event={event}
                            onClick={() => setEditingEvent(event)}
                            style={getEventStyle(event)}
                        />
                    ))}
                </div>

                {/* Unscheduled Tasks Area - Fixed at bottom on mobile */}
                <div className="fixed md:relative bottom-20 md:bottom-0 left-0 right-0 border-t border-border p-4 bg-bg-primary/95 md:bg-bg-secondary/50 backdrop-blur-xl z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] md:shadow-none">
                    <div className="flex items-center gap-2 mb-3">
                        <CalendarIcon className="w-4 h-4 text-text-secondary" />
                        <h3 className="text-sm font-medium text-text-secondary">Drag to schedule</h3>
                    </div>

                    {unscheduledTasks.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-auto">
                            {unscheduledTasks.slice(0, 8).map((task) => (
                                <DraggableTask key={task.id} task={task} />
                            ))}
                            {unscheduledTasks.length > 8 && (
                                <span className="px-3 py-1.5 text-xs text-text-secondary">
                                    +{unscheduledTasks.length - 8} more
                                </span>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-text-secondary">All tasks are scheduled!</p>
                    )}
                </div>
            </motion.div>

            <DragOverlay>
                {activeId && (
                    dragType === 'event'
                        ? <EventDragOverlay eventId={activeId} events={events} />
                        : <TaskDragOverlay taskId={activeId} tasks={tasks} />
                )}
            </DragOverlay>

            <EventTimeEditor
                event={editingEvent}
                isOpen={!!editingEvent}
                onClose={() => setEditingEvent(null)}
            />
        </DndContext>
    );
}

// Simple hour row for the grid background
function HourRow({ hour, date, activeId }: { hour: number; date: string; activeId: string | null }) {
    const droppableId = `${date}_${hour}`;
    const { setNodeRef, isOver } = useDroppable({
        id: droppableId,
        data: { date, hour },
    });

    return (
        <div
            ref={setNodeRef}
            style={{ height: `${HOUR_HEIGHT}px` }}
            className={cn(
                'border-b border-border/50 flex items-start transition-colors',
                isOver && 'bg-accent/10'
            )}
        >
            <div className="w-16 flex-shrink-0 pr-3 pt-2 text-right">
                <span className="text-xs font-medium text-text-secondary/70">{formatHour(hour)}</span>
            </div>

            {isOver && activeId && (
                <div className="flex-1 m-1 h-14 border-2 border-dashed border-accent/50 rounded-2xl flex items-center justify-center bg-accent/5">
                    <span className="text-xs font-medium text-accent">Drop here</span>
                </div>
            )}
        </div>
    );
}

// Draggable calendar event
function DraggableEvent({ event, onClick, style }: { event: CalendarEventType; onClick: () => void; style: React.CSSProperties }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: event.id,
        data: { type: 'event', event },
    });

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, touchAction: 'none' }}
            className={cn(
                'absolute left-16 right-2',
                isDragging && 'opacity-50'
            )}
            {...listeners}
            {...attributes}
        >
            <CalendarEvent
                event={event}
                onClick={onClick}
                style={{}}
                isDraggable
            />
        </div>
    );
}

function DraggableTask({ task }: { task: Task }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
        data: { type: 'task', task },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{ touchAction: 'none' }}
            className={cn(
                'select-none px-3 py-2 bg-bg-tertiary border border-border/50 rounded-2xl text-sm font-medium shadow-sm',
                'cursor-grab active:cursor-grabbing transition-all',
                'hover:border-accent/50 hover:shadow-md',
                'flex items-center gap-2',
                isDragging && 'opacity-50'
            )}
        >
            <GripVertical className="w-3 h-3 text-text-secondary/50 flex-shrink-0" />
            <span className="truncate max-w-[120px]">
                {task.title}
            </span>
        </div>
    );
}

function TaskDragOverlay({ taskId, tasks }: { taskId: string; tasks: Task[] }) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;

    return (
        <div className="px-4 py-2.5 bg-gradient-to-r from-accent to-blue-400 text-white rounded-2xl shadow-elevated text-sm font-semibold">
            {task.title}
        </div>
    );
}

function EventDragOverlay({ eventId, events }: { eventId: string; events: CalendarEventType[] }) {
    const event = events.find((e) => e.id === eventId);
    if (!event) return null;

    return (
        <div className="px-4 py-2.5 bg-gradient-to-r from-accent to-blue-400 text-white rounded-2xl shadow-elevated text-sm font-semibold">
            📅 {event.title}
        </div>
    );
}
