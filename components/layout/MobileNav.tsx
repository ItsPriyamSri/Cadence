'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ListTodo, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const tabs = [
    { href: '/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/notes', label: 'Notes', icon: FileText },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-4 left-4 right-4 z-50 bg-bg-primary/80 backdrop-blur-xl border border-border rounded-3xl shadow-elevated md:hidden">
            <div className="flex items-center justify-around h-16 px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-colors relative h-12 mt-2',
                                isActive ? 'text-accent' : 'text-text-secondary active:text-text-primary'
                            )}
                            aria-label={tab.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobileActiveTab"
                                    className="absolute inset-0 bg-accent-light rounded-2xl"
                                    transition={{ type: 'spring', duration: 0.3 }}
                                />
                            )}
                            <Icon className="w-5 h-5 relative z-10" />
                            <span className="text-xs font-medium relative z-10">{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
