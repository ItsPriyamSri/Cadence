'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
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

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-accent rounded-2xl" />
                    <div className="w-24 h-4 bg-bg-secondary rounded" />
                </div>
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
            <main className="pb-20 md:pb-8">
                {children}
            </main>
            <MobileNav />
            <InstallPrompt />
        </div>
    );
}
