'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    DndContext, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor,
    DragStartEvent, DragEndEvent, useDraggable, useDroppable,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Loader2, GripVertical, Move } from 'lucide-react';
import { ActiveTaskBanner } from './ActiveTaskBanner';
import { CalendarEvent } from './CalendarEvent';
import { EventTimeEditor } from './EventTimeEditor';
import { useCalendarEvents } from '@/lib/hooks/useCalendarEvents';
import { useTasks } from '@/lib/hooks/useTasks';
import { handleTaskDropOnCalendar, rescheduleEvent } from '@/lib/actions/calendar';
import { useAppStore } from '@/lib/store/app';
import { CalendarEvent as CalendarEventType, Task } from '@/lib/firebase/firestore';
import { generateHourSlots, formatDisplayDate, formatDateKey, formatHour, addDays, subDays, isToday as checkIsToday } from '@/lib/utils/dates';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

const HOUR_HEIGHT = 72;

function CurrentTimeIndicator({ startHour }: { startHour: number }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const topPosition = ((totalMinutes - startHour * 60) / 60) * HOUR_HEIGHT;
    if (hours < startHour || hours > 23) return null;
    return (
        <div className="absolute left-14 right-0 z-20 pointer-events-none" style={{ top: `${topPosition}px` }}>
            <div className="relative flex items-center">
                <div className="absolute -left-14 -top-2 text-[10px] font-bold text-danger bg-danger-bg px-1.5 py-0.5 rounded">
                    {format(currentTime, 'h:mm')}
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_8px_var(--danger)] -ml-1" />
                <div className="flex-1 h-[2px] bg-danger" />
            </div>
        </div>
    );
}

export function DailyCalendar() {
    const { selectedDate, setSelectedDate } = useAppStore();
    const dateKey = formatDateKey(selectedDate);
    const { events, loading } = useCalendarEvents(dateKey);
    const { tasks } = useTasks();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [hasScrolled, setHasScrolled] = useState(false);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragType, setDragType] = useState<'task' | 'event' | null>(null);
    const [editingEvent, setEditingEvent] = useState<CalendarEventType | null>(null);

    const hours = useMemo(() => generateHourSlots(0, 23), []);
    const isToday = checkIsToday(selectedDate);
    const startHour = 0;

    useEffect(() => {
        if (isToday && !hasScrolled && scrollContainerRef.current) {
            const now = new Date();
            const scrollToHour = Math.max(0, now.getHours() - 1);
            setTimeout(() => {
                scrollContainerRef.current?.scrollTo({ top: scrollToHour * HOUR_HEIGHT, behavior: 'smooth' });
                setHasScrolled(true);
            }, 100);
        }
    }, [isToday, hasScrolled]);

    useEffect(() => { setHasScrolled(false); }, [dateKey]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setDragType(event.active.data.current?.type === 'event' ? 'event' : 'task');
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

        if (activeData?.type === 'event') {
            const eventToReschedule = events.find((e) => e.id === active.id);
            if (eventToReschedule) {
                try {
                    await rescheduleEvent(eventToReschedule.id, dropDate, dropHour, eventToReschedule.taskId);
                } catch (error) {
                    console.error('Failed to reschedule event:', error);
                }
            }
            return;
        }

        const task = tasks.find((t) => t.id === active.id);
        if (task) {
            try {
                await handleTaskDropOnCalendar(task.id, task.title, dropDate, dropHour);
            } catch (error) {
                console.error('Failed to schedule task:', error);
            }
        }
    };

    const getEventStyle = (event: CalendarEventType): React.CSSProperties => {
        const [startH, startM] = event.startTime.split(':').map(Number);
        const [endH, endM] = event.endTime.split(':').map(Number);
        const startTotalMins = startH * 60 + startM;
        const endTotalMins = endH * 60 + endM;
        const durationMins = endTotalMins - startTotalMins;
        const startOffset = (startH - startHour) * 60 + startM;
        const top = (startOffset / 60) * HOUR_HEIGHT + 4;
        const height = Math.max(32, (durationMins / 60) * HOUR_HEIGHT - 8);
        return { top: `${top}px`, height: `${height}px` };
    };

    const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
    const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
    const goToToday = () => setSelectedDate(new Date());

    const unscheduledTasks = tasks.filter((t) => !t.calendarSlot && t.status !== 'done');

    if (loading && events.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col md:flex-row md:gap-5 px-4 pt-3 md:px-8 md:pt-0"
            >
                {/* Timeline column */}
                <div className="flex-1 min-w-0 min-h-0 flex flex-col pb-[calc(env(safe-area-inset-bottom,0px)+96px)] md:pb-6">
                    <ActiveTaskBanner />

                    {/* Date nav */}
                    <div className="shrink-0 flex items-center gap-3 pb-3">
                        <div>
                            <div className="text-xl font-bold tracking-tight text-text-primary">{format(selectedDate, 'EEEE')}</div>
                            <div className="text-sm text-text-secondary">{formatDisplayDate(selectedDate)}</div>
                        </div>
                        {isToday && (
                            <span className="px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent text-xs font-bold">Today</span>
                        )}
                        <div className="flex-1" />
                        {!isToday && (
                            <button onClick={goToToday} className="px-3 py-2 rounded-xl border border-border bg-bg-primary text-accent text-sm font-semibold hover:bg-accent-subtle transition-colors">
                                Go to Today
                            </button>
                        )}
                        <button onClick={goToPreviousDay} aria-label="Previous day" className="w-[38px] h-[38px] flex items-center justify-center rounded-xl border border-border bg-bg-primary text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors">
                            <ChevronLeft className="w-[18px] h-[18px]" />
                        </button>
                        <button onClick={goToNextDay} aria-label="Next day" className="w-[38px] h-[38px] flex items-center justify-center rounded-xl border border-border bg-bg-primary text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors">
                            <ChevronRight className="w-[18px] h-[18px]" />
                        </button>
                    </div>

                    {/* Timeline scroll */}
                    <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border bg-bg-primary shadow-elev-1">
                        <div className="relative">
                            {hours.map((hour) => (
                                <HourRow key={hour} hour={hour} date={dateKey} activeId={activeId} />
                            ))}
                            {isToday && <CurrentTimeIndicator startHour={startHour} />}
                            {events.map((event) => (
                                <DraggableEvent key={event.id} event={event} onClick={() => setEditingEvent(event)} style={getEventStyle(event)} />
                            ))}
                        </div>
                    </div>

                    {/* Mobile tray */}
                    <div className="md:hidden shrink-0 pt-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Move className="w-[15px] h-[15px] text-text-tertiary" />
                            <span className="text-xs font-bold tracking-[0.04em] uppercase text-text-tertiary">Drag to schedule</span>
                        </div>
                        {unscheduledTasks.length > 0 ? (
                            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
                                {unscheduledTasks.slice(0, 8).map((task) => <DraggableTask key={task.id} task={task} />)}
                                {unscheduledTasks.length > 8 && (
                                    <span className="flex items-center px-3 text-sm font-semibold text-text-tertiary whitespace-nowrap">
                                        +{unscheduledTasks.length - 8} more
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-text-tertiary">All caught up — nothing unscheduled.</p>
                        )}
                    </div>
                </div>

                {/* Side rail (tablet/desktop) */}
                <aside className="hidden md:flex flex-col shrink-0 w-[268px] mb-6 rounded-lg bg-bg-secondary border border-border p-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                        <Move className="w-4 h-4 text-accent" />
                        <span className="text-sm font-bold text-text-primary">Unscheduled</span>
                        <span className="ml-auto text-xs font-bold text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">{unscheduledTasks.length}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mb-3">Drag a task onto the timeline to schedule it.</p>
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2">
                        {unscheduledTasks.length > 0 ? (
                            unscheduledTasks.map((task) => <DraggableTask key={task.id} task={task} wrap />)
                        ) : (
                            <div className="text-center py-6 text-text-tertiary text-sm">All caught up — nothing unscheduled.</div>
                        )}
                    </div>
                </aside>
            </motion.div>

            <DragOverlay>
                {activeId && (dragType === 'event'
                    ? <EventDragOverlay eventId={activeId} events={events} />
                    : <TaskDragOverlay taskId={activeId} tasks={tasks} />)}
            </DragOverlay>

            <EventTimeEditor event={editingEvent} isOpen={!!editingEvent} onClose={() => setEditingEvent(null)} />
        </DndContext>
    );
}

function HourRow({ hour, date, activeId }: { hour: number; date: string; activeId: string | null }) {
    const droppableId = `${date}_${hour}`;
    const { setNodeRef, isOver } = useDroppable({ id: droppableId, data: { date, hour } });
    return (
        <div
            ref={setNodeRef}
            style={{ height: `${HOUR_HEIGHT}px` }}
            className={cn('relative border-b border-border/60 flex items-start transition-colors', isOver && 'bg-accent-subtle')}
        >
            <div className="w-14 shrink-0 pr-2.5 pt-1.5 text-right">
                <span className="text-[11px] font-semibold text-text-tertiary">{formatHour(hour)}</span>
            </div>
            {isOver && activeId && (
                <div className="absolute left-16 right-2.5 top-1 bottom-1 border-[1.5px] border-dashed border-accent rounded-[10px] flex items-center justify-center bg-accent-subtle">
                    <span className="text-xs font-semibold text-accent">Drop here</span>
                </div>
            )}
        </div>
    );
}

function DraggableEvent({ event, onClick, style }: { event: CalendarEventType; onClick: () => void; style: React.CSSProperties }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: event.id, data: { type: 'event', event } });
    return (
        <div
            ref={setNodeRef}
            style={{ ...style, touchAction: 'none' }}
            className={cn('absolute left-16 right-2.5', isDragging && 'opacity-50')}
            {...listeners}
            {...attributes}
        >
            <CalendarEvent event={event} onClick={onClick} style={{}} isDraggable />
        </div>
    );
}

function DraggableTask({ task, wrap }: { task: Task; wrap?: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { type: 'task', task } });
    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{ touchAction: 'none' }}
            className={cn(
                'select-none flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-primary border border-border shadow-elev-1',
                'cursor-grab active:cursor-grabbing hover:shadow-elev-2 hover:-translate-y-px transition',
                isDragging && 'opacity-50'
            )}
        >
            <GripVertical className="w-3 h-3 text-text-tertiary shrink-0" />
            <span className={cn('text-sm font-semibold text-text-primary', wrap ? 'leading-snug' : 'truncate max-w-[120px]')}>
                {task.title}
            </span>
        </div>
    );
}

function TaskDragOverlay({ taskId, tasks }: { taskId: string; tasks: Task[] }) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;
    return <div className="px-4 py-2.5 rounded-xl bg-accent text-on-accent shadow-elev-3 text-sm font-semibold">{task.title}</div>;
}

function EventDragOverlay({ eventId, events }: { eventId: string; events: CalendarEventType[] }) {
    const event = events.find((e) => e.id === eventId);
    if (!event) return null;
    return <div className="px-4 py-2.5 rounded-xl bg-accent text-on-accent shadow-elev-3 text-sm font-semibold">📅 {event.title}</div>;
}
