'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { backdrop, modalContent } from '@/lib/utils/animations';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    showClose?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    className,
    showClose = true,
}: ModalProps) {
    // Handle escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEscape]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        variants={backdrop}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal content */}
                    <motion.div
                        variants={modalContent}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={cn(
                            'relative z-10',
                            'w-full max-w-md',
                            'bg-bg-primary rounded-3xl shadow-2xl',
                            'border border-white/5',
                            'max-h-[85vh] overflow-hidden flex flex-col',
                            className
                        )}
                    >
                        {/* Header */}
                        {(title || showClose) && (
                            <div className="flex items-center justify-between p-5 border-b border-border/50">
                                {title && (
                                    <h2 className="text-xl font-bold text-text-primary tracking-tight">
                                        {title}
                                    </h2>
                                )}
                                {showClose && (
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-xl hover:bg-bg-secondary transition-colors text-text-secondary hover:text-text-primary"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Body */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
