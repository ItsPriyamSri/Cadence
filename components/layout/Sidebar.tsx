'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUser, signOut } from '@/lib/firebase/auth';
import { useTasks } from '@/lib/hooks/useTasks';
import { useAppStore } from '@/lib/store/app';
import { navItems } from './navConfig';

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useUser();
    const { tasks } = useTasks();
    const { theme, cycleTheme } = useAppStore();

    const startedCount = tasks.filter((t) => t.status === 'started').length;
    const isLight = theme === 'light';
    const themeName = theme.charAt(0).toUpperCase() + theme.slice(1);
    const initial = (user?.displayName || user?.email || '?').charAt(0).toUpperCase();

    return (
        <aside className="hidden md:flex flex-col shrink-0 w-60 h-full box-border px-4 py-6 glass border-r border-[var(--glass-border)]">
            {/* Logo */}
            <Link href="/tasks" className="flex items-center gap-3 px-2 pb-6">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_6px_16px_var(--accent-glow)] bg-[linear-gradient(140deg,var(--accent),color-mix(in_srgb,var(--accent)_55%,#7c5cff))]">
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--on-accent)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13a8 8 0 108-9" /><path d="M12 8v4l3 2" /></svg>
                </span>
                <span className="text-lg font-bold tracking-tight text-text-primary">Cadence</span>
            </Link>

            {/* Nav */}
            <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-semibold transition-colors',
                                isActive
                                    ? 'bg-accent-subtle text-accent'
                                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.label}
                            {item.tab === 'tasks' && startedCount > 0 && (
                                <span className="ml-auto text-xs font-bold text-started bg-started-bg px-2 py-0.5 rounded-full">
                                    {startedCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="flex-1" />

            {/* Footer: theme toggle + user */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-border">
                <button
                    onClick={cycleTheme}
                    className="flex items-center gap-2.5 p-2.5 rounded-md border border-border bg-bg-primary text-text-secondary text-sm font-semibold hover:bg-bg-secondary transition-colors"
                >
                    <span className="text-accent flex">{isLight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</span>
                    {themeName}
                </button>

                <div className="flex items-center gap-2.5 p-2 rounded-md">
                    <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm bg-[linear-gradient(140deg,var(--accent),var(--secondary))]">
                        {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-text-primary truncate">
                            {user?.displayName || user?.email?.split('@')[0]}
                        </div>
                        <div className="text-xs text-text-tertiary truncate">{user?.email}</div>
                    </div>
                    <button
                        onClick={() => signOut()}
                        aria-label="Sign out"
                        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-text-tertiary hover:bg-danger-bg hover:text-danger transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
