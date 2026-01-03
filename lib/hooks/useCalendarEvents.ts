'use client';

import { useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
} from 'firebase/firestore';
import { db, CalendarEvent, docToCalendarEvent } from '@/lib/firebase/firestore';
import { useUser } from '@/lib/firebase/auth';
import { useCalendarStore } from '@/lib/store/optimistic';

export function useCalendarEvents(date?: string) {
    const { user } = useUser();
    const { events, loading, setEvents, setLoading } = useCalendarStore();

    useEffect(() => {
        if (!user) {
            setEvents([]);
            return;
        }

        setLoading(true);

        // Always fetch all events for the user, filter client-side for instant updates
        const q = query(
            collection(db, 'calendar_events'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const eventsData = snapshot.docs.map(docToCalendarEvent);
                setEvents(eventsData);
            },
            (error) => {
                console.error('Error fetching calendar events:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, setEvents, setLoading]);

    // Filter by date from optimistic store - this ensures newly added events show up
    const filteredEvents = date
        ? events.filter(e => e.date === date)
        : events;

    return { events: filteredEvents, loading };
}

export function getEventsForHour(events: CalendarEvent[], hour: number): CalendarEvent[] {
    return events.filter((event) => {
        const startHour = parseInt(event.startTime.split(':')[0], 10);
        return startHour === hour;
    });
}
