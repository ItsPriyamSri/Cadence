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
                <>
                    {/* Backdrop */}
                    <motion.div
                        variants={backdrop}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal content */}
                    <motion.div
                        variants={modalContent}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={cn(
                            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                            'w-[calc(100%-2rem)] max-w-md',
                            'bg-bg-primary rounded-2xl shadow-medium',
                            'max-h-[85vh] overflow-hidden flex flex-col',
                            className
                        )}
                    >
                        {/* Header */}
                        {(title || showClose) && (
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                {title && (
                                    <h2 className="text-lg font-semibold text-text-primary">
                                        {title}
                                    </h2>
                                )}
                                {showClose && (
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 rounded-lg hover:bg-bg-secondary transition-colors text-text-secondary"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Body */}
                        <div className="flex-1 overflow-auto">{children}</div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
