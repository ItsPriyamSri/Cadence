'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface CadenceLoaderProps {
    label?: string;
    className?: string;
}

/** Loading state: solid Cadence clock with a sweeping hand. */
export function CadenceLoader({ label, className }: CadenceLoaderProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label={label ?? 'Loading'}
            className={cn('flex flex-col items-center justify-center gap-4', className)}
        >
            <span className="w-[60px] h-[60px] rounded-4xl flex items-center justify-center bg-accent text-on-accent">
                <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                >
                    <path d="M4 13a8 8 0 108-9" />
                    <path d="M12 8v4" />
                    <g className="animate-cad-hand" style={{ transformOrigin: '12px 12px', transformBox: 'view-box' }}>
                        <path d="M12 12l3.2 2" />
                    </g>
                </svg>
            </span>
            {label && (
                <p className="text-sm font-medium text-text-secondary">{label}</p>
            )}
        </div>
    );
}
