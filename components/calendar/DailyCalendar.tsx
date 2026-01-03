'use client';

import React, { useState, useMemo } from 'react';
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
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { ActiveTaskBanner } from './ActiveTaskBanner';
import { CalendarEvent } from './CalendarEvent';
import { EventTimeEditor } from './EventTimeEditor';
import { Button } from '@/components/ui/Button';
import { useCalendarEvents } from '@/lib/hooks/useCalendarEvents';
import { useTasks } from '@/lib/hooks/useTasks';
import { handleTaskDropOnCalendar } from '@/lib/actions/calendar';
import { useAppStore } from '@/lib/store/app';
import { CalendarEvent as CalendarEventType } from '@/lib/firebase/firestore';
import { generateHourSlots, formatDisplayDate, formatDateKey, formatHour, addDays, subDays, isToday as checkIsToday } from '@/lib/utils/dates';
import { fadeIn } from '@/lib/utils/animations';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

const HOUR_HEIGHT = 72; // Height of each hour slot in pixels

export function DailyCalendar() {
    const { selectedDate, setSelectedDate } = useAppStore();
    const dateKey = formatDateKey(selectedDate);
    const { events, loading } = useCalendarEvents(dateKey);
    const { tasks } = useTasks();

    const [activeId, setActiveId] = useState<string | null>(null);
    const [editingEvent, setEditingEvent] = useState<CalendarEventType | null>(null);

    const hours = useMemo(() => generateHourSlots(0, 23), []);
    const isToday = checkIsToday(selectedDate);
    const startHour = 0; // First hour displayed on calendar

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 10 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 200, tolerance: 5 },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveId(null);

        const { active, over } = event;
        if (!over) return;

        const overId = over.id as string;
        const lastUnderscoreIndex = overId.lastIndexOf('_');
        const dropDate = overId.substring(0, lastUnderscoreIndex);
        const dropHour = parseInt(overId.substring(lastUnderscoreIndex + 1), 10);

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
                className="h-full flex flex-col"
            >
                <AnimatePresence>
                    <ActiveTaskBanner />
                </AnimatePresence>

                {/* Date Navigation */}
                <div className="sticky top-0 z-20 bg-bg-primary/90 backdrop-blur-lg border-b border-border">
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
                                    <span className="text-xs px-2 py-0.5 bg-[#06d6a0]/10 text-[#06d6a0] rounded-full font-medium">
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
                <div className="flex-1 overflow-auto relative">
                    {/* Hour rows (background) */}
                    {hours.map((hour) => (
                        <HourRow key={hour} hour={hour} date={dateKey} activeId={activeId} />
                    ))}

                    {/* Events overlaid on top */}
                    {events.map((event) => (
                        <CalendarEvent
                            key={event.id}
                            event={event}
                            onClick={() => setEditingEvent(event)}
                            style={getEventStyle(event)}
                        />
                    ))}
                </div>

                {/* Unscheduled Tasks Area */}
                <div className="border-t border-border p-4 bg-bg-secondary/50">
                    <div className="flex items-center gap-2 mb-3">
                        <CalendarIcon className="w-4 h-4 text-text-secondary" />
                        <h3 className="text-sm font-medium text-text-secondary">Drag to schedule</h3>
                    </div>

                    {unscheduledTasks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
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
                {activeId && <DragOverlayItem id={activeId} tasks={tasks} />}
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
                'border-b border-border flex items-start transition-colors',
                isOver && 'bg-[#3a86ff]/10'
            )}
        >
            <div className="w-16 flex-shrink-0 pr-3 pt-2 text-right">
                <span className="text-xs font-medium text-text-secondary">{formatHour(hour)}</span>
            </div>

            {isOver && activeId && (
                <div className="flex-1 m-1 h-14 border-2 border-dashed border-[#3a86ff]/50 rounded-xl flex items-center justify-center bg-[#3a86ff]/5">
                    <span className="text-xs font-medium text-[#3a86ff]">Drop here</span>
                </div>
            )}
        </div>
    );
}

function DraggableTask({ task }: { task: any }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
        data: { type: 'task', task },
    });

    return (
        <motion.div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            whileHover={{ scale: 1.02 }}
            className={cn(
                'px-3 py-2 bg-bg-primary border border-border rounded-xl text-sm font-medium',
                'cursor-grab active:cursor-grabbing transition-all',
                'hover:border-[#3a86ff]/50 hover:shadow-md',
                isDragging && 'opacity-50'
            )}
        >
            {task.title.slice(0, 25)}
            {task.title.length > 25 && '...'}
        </motion.div>
    );
}

function DragOverlayItem({ id, tasks }: { id: string; tasks: any[] }) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;

    return (
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#3a86ff] to-[#8338ec] text-white rounded-xl shadow-2xl text-sm font-semibold">
            {task.title}
        </div>
    );
}
