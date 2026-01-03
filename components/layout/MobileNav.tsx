'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ListTodo, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/lib/store/app';

const tabs = [
    { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
    { id: 'notes' as const, label: 'Notes', icon: FileText },
    { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
];

export function MobileNav() {
    const { activeTab, setActiveTab } = useAppStore();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-primary border-t border-border md:hidden">
            <div className="flex items-center justify-around h-16 px-4">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-colors relative',
                                isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
                            )}
                            aria-label={tab.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-accent/10 rounded-xl"
                                    transition={{ type: 'spring', duration: 0.3 }}
                                />
                            )}
                            <Icon className="w-5 h-5 relative z-10" />
                            <span className="text-xs font-medium relative z-10">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
