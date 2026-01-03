'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '@/lib/store/app';
import { cn } from '@/lib/utils/cn';

export function ThemeToggle() {
    const { theme, setTheme } = useAppStore();

    // Toggle between light and dark (dark includes AMOLED styling)
    const isDark = theme === 'dark' || theme === 'amoled';

    const handleToggle = () => {
        // Toggle between light and amoled (which is our dark theme)
        setTheme(isDark ? 'light' : 'amoled');
    };

    return (
        <motion.button
            onClick={handleToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                'p-2 rounded-xl transition-colors',
                'bg-bg-secondary hover:bg-bg-tertiary',
                'text-text-secondary hover:text-text-primary'
            )}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <motion.div
                initial={false}
                animate={{ rotate: isDark ? 0 : 180 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {isDark ? (
                    <Moon className="w-5 h-5" />
                ) : (
                    <Sun className="w-5 h-5" />
                )}
            </motion.div>
        </motion.button>
    );
}
