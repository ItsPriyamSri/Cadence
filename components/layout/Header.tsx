'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useUser, signOut } from '@/lib/firebase/auth';
import { useAppStore } from '@/lib/store/app';
import { CadenceMark } from '@/components/auth/AuthBits';

export function Header() {
    const { user } = useUser();
    const { theme, cycleTheme } = useAppStore();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const isLight = theme === 'light';
    const initial = (user?.displayName || user?.email || '?').charAt(0).toUpperCase();

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, [menuOpen]);

    return (
        <header
            className="md:hidden shrink-0 flex items-center gap-2.5 px-[18px] pb-3 glass border-b border-[var(--glass-border)] z-20"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
            <Link href="/tasks" className="flex items-center gap-2.5">
                <CadenceMark className="w-8 h-8 rounded-[10px]" />
                <span className="text-[19px] font-bold tracking-tight text-text-primary">Cadence</span>
            </Link>

            <div className="flex-1" />

            <button
                onClick={cycleTheme}
                aria-label="Toggle theme"
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-bg-primary text-accent"
            >
                {isLight ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label="Account"
                    className="w-10 h-10 shrink-0 rounded-full bg-accent text-on-accent font-bold text-[15px]"
                >
                    {initial}
                </button>
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                            transition={{ duration: 0.16 }}
                            className="absolute right-0 top-12 z-30 min-w-[220px] p-2 rounded-md bg-bg-primary border border-border shadow-elev-4"
                        >
                            <div className="flex items-center gap-3 p-2.5">
                                <span className="w-10 h-10 rounded-full flex items-center justify-center bg-accent text-on-accent font-bold">
                                    {initial}
                                </span>
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-text-primary truncate">
                                        {user?.displayName || user?.email?.split('@')[0]}
                                    </div>
                                    <div className="text-xs text-text-tertiary truncate">{user?.email}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => { setMenuOpen(false); signOut(); }}
                                className="w-full mt-1 flex items-center justify-center gap-2 py-3 rounded-md border border-danger bg-danger-bg text-danger text-sm font-semibold"
                            >
                                <LogOut className="w-4 h-4" /> Sign out
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
}
