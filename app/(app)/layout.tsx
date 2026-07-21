'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RailTopbar } from '@/components/layout/RailTopbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { Confetti } from '@/components/ui/Confetti';
import { useUser } from '@/lib/firebase/auth';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--app-bg)' }}>
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <span className="mt-4 text-sm font-medium text-text-secondary animate-pulse">Loading Cadence…</span>
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
        </div>
    );
}
