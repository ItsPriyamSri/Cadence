'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={cn(
                            'w-full px-3.5 py-3 rounded-md appearance-none',
                            'bg-bg-secondary text-text-primary',
                            'border-[1.5px] border-border',
                            'focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-subtle)]',
                            'transition-all duration-200',
                            'cursor-pointer',
                            error && 'border-danger',
                            className
                        )}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                </div>
                {error && (
                    <p className="mt-1.5 text-xs text-danger">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
