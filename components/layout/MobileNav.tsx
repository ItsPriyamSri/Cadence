'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/lib/store/app';
import { navItems, tabFromPathname } from './navConfig';

export function MobileNav() {
    const pathname = usePathname();
    const tab = tabFromPathname(pathname);
    const { openTaskForm, requestNoteCompose } = useAppStore();

    const showFab = tab === 'tasks' || tab === 'notes';
    const fabAction = () => (tab === 'tasks' ? openTaskForm() : requestNoteCompose());
    const fabLabel = tab === 'tasks' ? 'New Task' : 'Capture a thought';

    return (
        <div className="md:hidden">
            {/* FAB */}
            {showFab && (
                <button
                    onClick={fabAction}
                    aria-label={fabLabel}
                    className="fixed right-[18px] z-30 w-14 h-14 rounded-[20px] flex items-center justify-center bg-accent text-on-accent shadow-[0_10px_26px_var(--accent-glow),var(--elev-3)] transition-transform active:scale-[0.94]"
                    style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
                >
                    <Plus className="w-[26px] h-[26px]" strokeWidth={2.4} />
                </button>
            )}

            {/* Bottom nav */}
            <nav
                className="fixed left-0 right-0 bottom-0 z-30 flex justify-center px-4 pointer-events-none"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}
            >
                <div className="relative flex gap-0.5 p-[7px] rounded-3xl glass shadow-elev-3 pointer-events-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? 'page' : undefined}
                                aria-label={item.label}
                                className={cn(
                                    'relative flex flex-col items-center justify-center gap-1 w-[72px] h-12 rounded-2xl transition-colors',
                                    isActive ? 'text-accent' : 'text-text-secondary active:text-text-primary'
                                )}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="mobileNavPill"
                                        className="absolute inset-0 rounded-2xl bg-accent-subtle"
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}
                                <Icon className="w-5 h-5 relative z-10" />
                                <span className="text-[11px] font-semibold relative z-10">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
