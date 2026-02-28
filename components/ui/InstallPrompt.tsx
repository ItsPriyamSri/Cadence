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
        // Don't show on desktop
        const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) || window.innerWidth <= 768;

        if (!isMobile) return;

        // Don't show if already running as PWA (standalone mode)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) return;

        // Check if previously dismissed this session
        const wasDismissed = sessionStorage.getItem('cadence-install-dismissed');
        if (wasDismissed) return;

        // Listen for the beforeinstallprompt event (Chromium browsers / Brave)
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
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
                        'fixed bottom-20 left-4 right-4 z-50',
                        'bg-bg-primary border border-border/50 rounded-2xl',
                        'shadow-2xl p-4',
                        'md:hidden' // Extra safety: hide on desktop
                    )}
                >
                    <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="w-12 h-12 min-w-[48px] rounded-xl bg-gradient-to-br from-[#4ecdc4] to-[#a8dadc] flex items-center justify-center shadow-md">
                            <Download className="w-6 h-6 text-white" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary">Install Cadence</p>
                            <p className="text-xs text-text-secondary">Get the full app experience</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={handleInstall}
                                className="px-4 py-2 bg-[#4ecdc4] text-white text-sm font-semibold rounded-xl active:scale-95 transition-transform"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="p-2 rounded-lg text-text-secondary hover:bg-bg-secondary transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
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
