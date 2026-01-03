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
        <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-lg border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#3a86ff] to-[#8338ec] rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-sm">C</span>
                            </div>
                            <span className="font-semibold text-lg text-text-primary hidden sm:block">
                                Cadence
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname === link.href;

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={cn(
                                            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                                            isActive
                                                ? 'bg-accent/10 text-accent'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right Side - Theme Toggle + User */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* User Menu */}
                        {user && (
                            <>
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-bg-secondary rounded-xl">
                                    <User className="w-4 h-4 text-text-secondary" />
                                    <span className="text-sm text-text-primary">
                                        {user.displayName || user.email?.split('@')[0]}
                                    </span>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
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
