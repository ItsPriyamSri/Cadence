'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RailTopbar } from '@/components/layout/RailTopbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { Confetti } from '@/components/ui/Confetti';
import { FocusOverlay } from '@/components/focus/FocusOverlay';
import { CadenceLoader } from '@/components/ui/CadenceLoader';
import { useUser } from '@/lib/firebase/auth';
import { useTasks } from '@/lib/hooks/useTasks';
import { useCalendarEvents } from '@/lib/hooks/useCalendarEvents';
import { ensureWeeklySeriesForOpenHabits } from '@/lib/actions/habitSeries';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useUser();
    const router = useRouter();
    const { tasks, loading: tasksLoading } = useTasks();
    const { loading: eventsLoading } = useCalendarEvents();

    const habits = useMemo(() => tasks.filter((t) => t.repeat != null), [tasks]);
    const habitsSignature = useMemo(
        () =>
            habits
                .map((h) => `${h.id}:${h.sameTimeWeekly}:${h.dueDate}:${h.lockedTime?.startTime}-${h.lockedTime?.endTime}`)
                .join('|'),
        [habits]
    );

    useEffect(() => {
        if (tasksLoading || eventsLoading) return;
        ensureWeeklySeriesForOpenHabits().catch((e) => console.error(e));
    }, [tasksLoading, eventsLoading, habitsSignature]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
                <CadenceLoader label="Loading Cadence" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex h-[100dvh] overflow-hidden" style={{ background: 'var(--app-bg)' }}>
            <Sidebar />

            {/* Main column */}
            <div className="relative flex-1 flex flex-col min-w-0 h-full">
                <Header />
                <RailTopbar />

                <main
                    className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
                    data-cad-scroll
                >
                    {children}
                </main>

                <MobileNav />
            </div>

            <InstallPrompt />
            <Confetti />
            <FocusOverlay />
        </div>
    );
}
