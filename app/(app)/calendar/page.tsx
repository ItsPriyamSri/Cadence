'use client';

import React from 'react';
import { DailyCalendar } from '@/components/calendar/DailyCalendar';

export default function CalendarPage() {
    return (
        <div className="h-full max-w-5xl mx-auto">
            <DailyCalendar />
        </div>
    );
}
