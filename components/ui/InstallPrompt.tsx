'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // === 1. Register Service Worker (required for PWA installability) ===
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.warn('SW registration failed:', err);
            });
        }

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
                        'fixed bottom-20 left-3 right-3 z-50',
                        'bg-bg-primary border border-border rounded-2xl',
                        'shadow-2xl p-4',
                        'lg:hidden' // Hide on large screens
                    )}
                >
                    <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="w-11 h-11 min-w-[44px] rounded-xl bg-gradient-to-br from-[#4ecdc4] to-[#a8dadc] flex items-center justify-center shadow-md">
                            <Download className="w-5 h-5 text-white" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary">Install Cadence</p>
                            <p className="text-xs text-text-secondary leading-tight">Add to home screen for the full experience</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handleInstall}
                                className="px-4 py-2.5 bg-[#4ecdc4] text-white text-sm font-semibold rounded-xl active:scale-95 transition-transform min-h-[44px]"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="p-2.5 rounded-lg text-text-secondary hover:bg-bg-secondary transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
