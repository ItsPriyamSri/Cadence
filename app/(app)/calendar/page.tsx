'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DailyCalendar } from '@/components/calendar/DailyCalendar';
import { fadeIn } from '@/lib/utils/animations';

export default function CalendarPage() {
    return (
        <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto h-[calc(100vh-8rem)]"
        >
            <DailyCalendar />
        </motion.div>
    );
}
