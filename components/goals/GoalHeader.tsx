'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Plus, Star, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from './ProgressBar';
import { useActiveGoals, useGoalProgress } from '@/lib/hooks/useGoals';
import { useAppStore } from '@/lib/store/app';
import { fadeIn, scaleUp } from '@/lib/utils/animations';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';

export function GoalHeader() {
    const { goals } = useActiveGoals();
    const { openGoalModal } = useAppStore();

    const weeklyGoal = goals.find((g) => g.type === 'weekly');

    if (!weeklyGoal) {
        return (
            <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="p-4 border-b border-border"
            >
                <Button
                    onClick={() => openGoalModal()}
                    variant="outline"
                    className={cn(
                        'w-full border-dashed border-2 justify-center',
                        'hover:border-accent hover:bg-accent/5',
                        'group'
                    )}
                >
                    <motion.div
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Plus className="w-4 h-4 mr-2 group-hover:text-accent transition-colors" />
                    </motion.div>
                    Set Weekly Goal
                </Button>
            </motion.div>
        );
    }

    return <GoalCard goal={weeklyGoal} />;
}

function GoalCard({ goal }: { goal: any }) {
    const progress = useGoalProgress(goal.id);
    const { openGoalModal } = useAppStore();

    const isNearComplete = progress >= 80;
    const isComplete = progress === 100;

    return (
        <motion.div
            variants={scaleUp}
            initial="hidden"
            animate="visible"
            className={cn(
                'relative overflow-hidden border-b',
                'bg-gradient-to-r from-accent/5 via-purple-500/5 to-blue-500/5',
                'dark:from-accent/10 dark:via-purple-500/10 dark:to-blue-500/10'
            )}
        >
            {/* Animated background gradient */}
            <motion.div
                className="absolute inset-0 opacity-30"
                animate={{
                    background: [
                        'radial-gradient(circle at 0% 50%, rgba(0,122,255,0.1) 0%, transparent 50%)',
                        'radial-gradient(circle at 100% 50%, rgba(0,122,255,0.1) 0%, transparent 50%)',
                        'radial-gradient(circle at 0% 50%, rgba(0,122,255,0.1) 0%, transparent 50%)',
                    ],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={isComplete ? { rotate: 360 } : undefined}
                            transition={{ duration: 0.5 }}
                            className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                isComplete
                                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                                    : 'bg-accent/10'
                            )}
                        >
                            {isComplete ? (
                                <Zap className="w-4 h-4" />
                            ) : (
                                <Star className={cn(
                                    'w-4 h-4',
                                    isNearComplete ? 'text-yellow-500' : 'text-accent'
                                )} />
                            )}
                        </motion.div>
                        <div>
                            <h3 className="text-sm font-semibold text-text-primary">
                                {goal.title}
                            </h3>
                            <p className="text-xs text-text-secondary">
                                {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} goal
                            </p>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openGoalModal(goal.id)}
                        className="p-2 rounded-lg hover:bg-bg-secondary transition-colors"
                        aria-label="Edit goal"
                    >
                        <MoreVertical className="w-4 h-4 text-text-secondary" />
                    </motion.button>
                </div>

                <ProgressBar value={progress} className="h-2" />

                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className={cn(
                            'w-3.5 h-3.5',
                            progress > 50 ? 'text-green-500' : 'text-text-secondary'
                        )} />
                        <span className={cn(
                            'text-sm font-semibold',
                            isComplete ? 'text-green-500' :
                                isNearComplete ? 'text-yellow-500' : 'text-text-primary'
                        )}>
                            {progress}%
                        </span>
                        <span className="text-xs text-text-secondary">complete</span>
                    </div>

                    <span className="text-xs text-text-secondary px-2 py-1 bg-bg-secondary rounded-lg">
                        Ends {format(goal.endDate.toDate(), 'MMM d')}
                    </span>
                </div>

                {/* Celebration effect when complete */}
                <AnimatePresence>
                    {isComplete && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-2 right-12"
                        >
                            <span className="text-xl">🎉</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
