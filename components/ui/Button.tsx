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
    primary: 'bg-gradient-to-r from-accent to-indigo-500 text-white shadow-md hover:shadow-elevated hover:shadow-accent/30 active:scale-[0.98]',
    secondary: 'bg-bg-secondary text-text-primary hover:bg-bg-tertiary hover:shadow-sm active:scale-[0.98]',
    ghost: 'bg-transparent text-text-primary hover:bg-bg-secondary active:bg-bg-tertiary',
    outline: 'bg-transparent border-2 border-border text-text-primary hover:border-accent/50 hover:bg-accent/5 active:bg-accent/10 hover:shadow-sm',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md hover:shadow-elevated hover:shadow-red-500/30 active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-2xl gap-2',
    lg: 'px-6 py-3.5 text-base rounded-3xl gap-2.5',
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
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
                'disabled:opacity-50 disabled:pointer-events-none disabled:grayscale',
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
