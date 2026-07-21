'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/lib/store/app';
import { pageMeta, tabFromPathname } from './navConfig';

export function RailTopbar() {
    const pathname = usePathname();
    const tab = tabFromPathname(pathname);
    const meta = pageMeta[tab];
    const { openTaskForm, requestNoteCompose } = useAppStore();

    return (
        <div className="hidden md:flex items-center gap-3.5 px-8 pt-6 pb-4">
            <div>
                <h1 className="text-[27px] font-bold tracking-tight text-text-primary leading-none">{meta.title}</h1>
                <p className="mt-1 text-sm text-text-secondary">{meta.subtitle}</p>
            </div>
            <div className="flex-1" />
            {tab === 'tasks' && (
                <button
                    onClick={() => openTaskForm()}
                    className="flex items-center gap-2 px-[18px] py-2.5 rounded-md border-none bg-accent text-on-accent text-sm font-semibold shadow-[0_6px_16px_var(--accent-glow)] transition-transform active:scale-[0.97] hover:brightness-105"
                >
                    <Plus className="w-[18px] h-[18px]" strokeWidth={2.4} /> New Task
                </button>
            )}
            {tab === 'notes' && (
                <button
                    onClick={requestNoteCompose}
                    className="flex items-center gap-2 px-[18px] py-2.5 rounded-md border-none bg-accent text-on-accent text-sm font-semibold shadow-[0_6px_16px_var(--accent-glow)] transition-transform active:scale-[0.97] hover:brightness-105"
                >
                    <Plus className="w-[18px] h-[18px]" strokeWidth={2.4} /> Capture a Thought
                </button>
            )}
        </div>
    );
}
