'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { RailTopbar } from '@/components/layout/RailTopbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { Confetti } from '@/components/ui/Confetti';
import { CadenceLoader } from '@/components/ui/CadenceLoader';
import { useUser } from '@/lib/firebase/auth';

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
        </div>
    );
}
