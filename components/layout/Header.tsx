'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ListTodo, FileText, Calendar, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUser, signOut } from '@/lib/firebase/auth';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const navLinks = [
    { href: '/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/notes', label: 'Notes', icon: FileText },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
];

export function Header() {
    const pathname = usePathname();
    const { user } = useUser();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-xl border-b border-border transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14 relative">

                    {/* 1. Left: Logo */}
                    <div className="flex-1 flex items-center justify-start">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#3a86ff] to-[#8338ec] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                <span className="text-white font-bold text-sm">C</span>
                            </div>
                            <span className="font-semibold text-lg text-text-primary hidden sm:block tracking-tight group-hover:text-accent transition-colors">
                                Cadence
                            </span>
                        </Link>
                    </div>

                    {/* 2. Center: Navigation */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <nav className="hidden md:flex items-center gap-1 p-1 bg-bg-secondary/50 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname === link.href;

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300',
                                            isActive
                                                ? 'bg-bg-primary text-accent shadow-sm scale-105'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary/80'
                                        )}
                                    >
                                        <Icon className={cn("w-4 h-4 transition-transform duration-300", isActive && "scale-110")} />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* 3. Right: Theme Toggle + User */}
                    <div className="flex-1 flex items-center justify-end gap-3">
                        <ThemeToggle />

                        {user && (
                            <>
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-bg-secondary/50 rounded-xl border border-transparent hover:border-border transition-colors">
                                    <User className="w-4 h-4 text-text-secondary" />
                                    <span className="text-sm text-text-primary font-medium">
                                        {user.displayName || user.email?.split('@')[0]}
                                    </span>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="p-2 rounded-xl text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    aria-label="Sign out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
