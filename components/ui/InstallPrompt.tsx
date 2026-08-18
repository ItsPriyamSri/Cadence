'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CadenceMark } from '@/components/auth/AuthBits';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Service worker registration is handled automatically by next-pwa

        // === 2. Don't show on desktop ===
        const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) || (window.innerWidth <= 1024 && 'ontouchstart' in window);

        if (!isMobile) return;

        // === 3. Don't show if already running as installed PWA ===
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true ||
            document.referrer.includes('android-app://');

        if (isStandalone) return;

        // === 4. Check session dismiss ===
        const wasDismissed = sessionStorage.getItem('cadence-install-dismissed');
        if (wasDismissed) return;

        // === 5. Listen for beforeinstallprompt (Chromium / Brave / Edge) ===
        const handler = (e: Event) => {
            e.preventDefault(); // Prevent the mini-infobar
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // === 6. Hide banner when app gets installed ===
        const installedHandler = () => {
            setShowBanner(false);
            setDeferredPrompt(null);
        };
        window.addEventListener('appinstalled', installedHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.removeEventListener('appinstalled', installedHandler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setDismissed(true);
        setShowBanner(false);
        sessionStorage.setItem('cadence-install-dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {showBanner && !dismissed && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                        'fixed left-3 right-3 z-50 lg:hidden',
                        'flex items-center gap-3 p-3.5 rounded-lg glass shadow-elev-3'
                    )}
                    style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
                >
                    <CadenceMark className="w-10 h-10 shrink-0 rounded-xl" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary">Install Cadence</p>
                        <p className="text-xs text-text-secondary leading-tight">Add to your home screen for the full experience.</p>
                    </div>
                    <button
                        onClick={handleInstall}
                        className="px-3.5 py-2 rounded-[10px] bg-accent text-on-accent text-sm font-semibold active:scale-95 transition-transform shrink-0"
                    >
                        Install
                    </button>
                    <button
                        onClick={handleDismiss}
                        aria-label="Dismiss"
                        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-text-tertiary hover:bg-bg-secondary transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
