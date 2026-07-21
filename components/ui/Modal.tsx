'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    showClose?: boolean;
}

export function Modal({ isOpen, onClose, title, children, className, showClose = true }: ModalProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

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

    const contentAnim = isDesktop
        ? { initial: { opacity: 0, scale: 0.96, y: 8 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 8 } }
        : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={cn('fixed inset-0 z-50 flex justify-center', isDesktop ? 'items-center p-6' : 'items-end')}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
                    />

                    <motion.div
                        {...contentAnim}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                            'relative z-10 w-full flex flex-col bg-bg-primary border border-border',
                            'max-h-[90vh] overflow-hidden shadow-elev-4',
                            isDesktop ? 'max-w-md rounded-lg' : 'rounded-t-[var(--r-xl)]',
                            className
                        )}
                    >
                        {!isDesktop && <div className="mx-auto mt-3 mb-1 w-10 h-[5px] rounded-full bg-border-strong shrink-0" />}

                        {(title || showClose) && (
                            <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
                                {title && <h2 className="text-lg font-bold tracking-tight text-text-primary">{title}</h2>}
                                {showClose && (
                                    <button
                                        onClick={onClose}
                                        aria-label="Close"
                                        className="w-[34px] h-[34px] flex items-center justify-center rounded-[10px] bg-bg-secondary text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        <X className="w-[18px] h-[18px]" strokeWidth={2.2} />
                                    </button>
                                )}
                            </div>
                        )}

                        <div
                            className="flex-1 overflow-auto custom-scrollbar"
                            style={!isDesktop ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : undefined}
                        >
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
