'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
    children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-on-accent shadow-[0_6px_16px_var(--accent-glow)] hover:brightness-105 active:scale-[0.98]',
    secondary: 'bg-bg-secondary text-text-primary hover:bg-bg-tertiary active:scale-[0.98]',
    ghost: 'bg-transparent text-text-primary hover:bg-bg-secondary active:bg-bg-tertiary',
    outline: 'bg-bg-primary border-[1.5px] border-border text-text-primary hover:bg-bg-secondary',
    danger: 'bg-danger-bg border-[1.5px] border-danger text-danger hover:brightness-105 active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-2 text-sm rounded-md gap-1.5',
    md: 'px-4 py-2.5 text-base rounded-md gap-2',
    lg: 'px-6 py-3 text-base rounded-md gap-2.5',
};

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
            className={cn(
                'inline-flex items-center justify-center font-semibold',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--accent-glow)]',
                'disabled:opacity-50 disabled:pointer-events-none',
                variantStyles[variant],
                sizeStyles[size],
                loading && 'cursor-wait',
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            ) : icon}
            {children}
        </motion.button>
    );
}
