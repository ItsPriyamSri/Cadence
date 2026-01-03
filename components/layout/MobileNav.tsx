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
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur-xl border-t border-border md:hidden safe-area-bottom">
            <div className="flex items-center justify-around h-16 px-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-colors relative',
                                isActive ? 'text-accent' : 'text-text-secondary active:text-text-primary'
                            )}
                            aria-label={tab.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobileActiveTab"
                                    className="absolute inset-0 bg-accent/10 rounded-xl"
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
