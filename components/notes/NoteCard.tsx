'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Star, Trash2 } from 'lucide-react';
import { Note } from '@/lib/firebase/firestore';
import { updateNote } from '@/lib/actions/notes';
import { cn } from '@/lib/utils/cn';

interface NoteCardProps {
    note: Note;
    onOpen: () => void;
    onRequestDelete: () => void;
    selected?: boolean;
}

const SWIPE_THRESHOLD = 96;
const MOVE_TOLERANCE = 10;

export function NoteCard({ note, onOpen, onRequestDelete, selected }: NoteCardProps) {
    const text = note.content.trim();
    const [menuOpen, setMenuOpen] = useState(false);

    const x = useMotionValue(0);
    const revealOpacity = useTransform(x, [-SWIPE_THRESHOLD, -24, 0], [1, 0.4, 0]);

    // Long-press vs tap vs swipe arbitration.
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startPos = useRef<{ x: number; y: number } | null>(null);
    const suppressTap = useRef(false);
    const dragging = useRef(false);

    const clearPress = () => {
        if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
    };
    useEffect(() => clearPress, []);

    const onPointerDown = (e: React.PointerEvent) => {
        if (menuOpen) return;
        startPos.current = { x: e.clientX, y: e.clientY };
        suppressTap.current = false;
        clearPress();
        pressTimer.current = setTimeout(() => {
            suppressTap.current = true;
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(25);
            setMenuOpen(true);
        }, 450);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!startPos.current) return;
        const dx = Math.abs(e.clientX - startPos.current.x);
        const dy = Math.abs(e.clientY - startPos.current.y);
        if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) clearPress();
    };

    const onDragStart = () => { dragging.current = true; clearPress(); };

    const onDragEnd = (_: unknown, info: PanInfo) => {
        dragging.current = false;
        suppressTap.current = true; // a drag just happened; don't treat the release as a tap
        if (info.offset.x < -SWIPE_THRESHOLD) onRequestDelete();
    };

    const handleTap = () => {
        clearPress();
        if (suppressTap.current) { suppressTap.current = false; return; }
        onOpen();
    };

    // Close menu on outside interaction.
    useEffect(() => {
        if (!menuOpen) return;
        const close = () => setMenuOpen(false);
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, [menuOpen]);

    return (
        <motion.div
            layout
            layoutId={note.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="relative"
        >
            {/* Swipe-to-delete backdrop */}
            <motion.div
                style={{ opacity: revealOpacity }}
                className="absolute inset-0 rounded-lg bg-danger flex items-center justify-end pr-5 pointer-events-none"
            >
                <Trash2 className="w-5 h-5 text-white" />
            </motion.div>

            <motion.div
                drag="x"
                style={{ x }}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.7, right: 0 }}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onTap={handleTap}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={clearPress}
                onPointerCancel={clearPress}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
                className={cn(
                    'relative flex items-start gap-2 w-full p-4 rounded-lg text-left cursor-pointer select-none touch-pan-y',
                    'bg-bg-primary border shadow-elev-1',
                    selected ? 'border-accent' : 'border-border'
                )}
            >
                <p className={cn(
                    'flex-1 text-sm leading-relaxed whitespace-pre-line line-clamp-4',
                    text ? 'text-text-primary' : 'text-text-tertiary italic'
                )}>
                    {text || 'Empty note'}
                </p>
                {note.priority && <Star className="w-4 h-4 text-priority shrink-0 mt-0.5" fill="currentColor" strokeWidth={1.6} />}

                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 4 }}
                            transition={{ duration: 0.16 }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="absolute right-2 top-2 z-30 min-w-[168px] p-1.5 rounded-md bg-bg-primary border border-border shadow-elev-4"
                        >
                            <MenuItem
                                onClick={() => { setMenuOpen(false); updateNote(note.id, { priority: !note.priority }); }}
                                icon={<Star className="w-4 h-4" fill={note.priority ? 'currentColor' : 'none'} />}
                                label={note.priority ? 'Unstar' : 'Star'}
                                className={note.priority ? 'text-priority hover:bg-bg-secondary' : 'text-text-primary hover:bg-bg-secondary'}
                            />
                            <MenuItem
                                onClick={() => { setMenuOpen(false); onRequestDelete(); }}
                                icon={<Trash2 className="w-4 h-4" />}
                                label="Delete"
                                className="text-danger hover:bg-danger-bg"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

function MenuItem({ onClick, icon, label, className }: { onClick: () => void; icon: React.ReactNode; label: string; className?: string }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm font-semibold transition-colors', className)}
        >
            {icon}{label}
        </button>
    );
}
