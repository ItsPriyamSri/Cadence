'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            'w-full px-3.5 py-3 rounded-md',
                            'bg-bg-secondary text-text-primary placeholder:text-text-tertiary',
                            'border-[1.5px] border-border',
                            'focus:outline-none focus:border-accent focus:bg-bg-primary focus:shadow-[0_0_0_3px_var(--accent-subtle)]',
                            'transition-all duration-200',
                            icon && 'pl-10',
                            error && 'border-danger',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-danger">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
