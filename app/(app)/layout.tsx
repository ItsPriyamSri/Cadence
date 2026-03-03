'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
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

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
                <span className="mt-4 text-sm font-medium text-text-secondary animate-pulse">Loading Cadence...</span>
            </div>
        );
    }

    // Redirect handled in useEffect
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-bg-primary">
            <Header />
            <main className="pb-24 md:pb-8 pt-4">
                {children}
            </main>
            <MobileNav />
            <InstallPrompt />
        </div>
    );
}
