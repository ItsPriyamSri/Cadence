import React from 'react';
import { cn } from '@/lib/utils/cn';

export function CadenceMark({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'w-[60px] h-[60px] rounded-4xl flex items-center justify-center bg-accent text-on-accent',
                className
            )}
        >
            <svg className="w-1/2 h-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 13a8 8 0 108-9" /><path d="M12 8v4l3 2" />
            </svg>
        </span>
    );
}

export function GoogleGlyph() {
    return (
        <svg className="w-[18px] h-[18px] mr-2.5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 01-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z" />
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .6-2.2 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0012 23z" />
            <path fill="#FBBC05" d="M5.7 14c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2V7.2H2A11 11 0 001 12c0 1.8.4 3.5 1 4.8l3.7-2.8z" />
            <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3-3A11 11 0 002 7.2L5.7 10C6.6 7.4 9.1 5.4 12 5.4z" />
        </svg>
    );
}
