'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Target, Plus, Calendar, Star } from 'lucide-react';
import { useAppStore } from '@/lib/store/app';
import { useGoals } from '@/lib/hooks/useGoals';
import { cn } from '@/lib/utils/cn';
import { format } from 'date-fns';

export function GoalsTile() {
    const { isGoalsExpanded, toggleGoalsExpanded, openGoalModal } = useAppStore();
    const { goals, loading } = useGoals();

    const activeGoals = goals.filter(g => {
        const endDate = g.endDate?.toDate?.() || new Date(g.endDate as any);
        return endDate >= new Date();
    });

    return (
        <div className="mb-6">
            {/* Collapsed Tile */}
            <motion.button
                onClick={toggleGoalsExpanded}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                    'w-full p-4 rounded-2xl border-2 border-border',
                    'bg-gradient-to-r from-[#8338ec]/10 to-[#3a86ff]/10',
                    'hover:border-[#8338ec]/30 transition-all',
                    'flex items-center justify-between'
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8338ec] to-[#3a86ff] flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-text-primary">Goals</p>
                        <p className="text-xs text-text-secondary">
                            {loading ? 'Loading...' : `${activeGoals.length} active goal${activeGoals.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isGoalsExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronRight className="w-5 h-5 text-text-secondary" />
                </motion.div>
            </motion.button>

            {/* Expanded Goals Section */}
            <AnimatePresence>
                {isGoalsExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 space-y-3">
                            {/* Add Goal Button */}
                            <motion.button
                                onClick={() => openGoalModal()}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="w-full p-3 border-2 border-dashed border-border rounded-xl hover:border-[#8338ec]/50 hover:bg-[#8338ec]/5 transition-all flex items-center justify-center gap-2 text-text-secondary hover:text-[#8338ec]"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-sm font-medium">Add Goal</span>
                            </motion.button>

                            {/* Goals List */}
                            {activeGoals.map((goal) => (
                                <motion.div
                                    key={goal.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => openGoalModal(goal.id)}
                                    className={cn(
                                        'p-4 rounded-xl border border-border cursor-pointer',
                                        'bg-bg-secondary/50 hover:bg-bg-secondary transition-all',
                                        'hover:border-[#8338ec]/30'
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-[#ffbe0b]" />
                                            <span className="font-medium text-text-primary">{goal.title}</span>
                                        </div>
                                        <span className={cn(
                                            'text-xs px-2 py-1 rounded-lg font-medium',
                                            goal.type === 'weekly' && 'bg-[#3a86ff]/10 text-[#3a86ff]',
                                            goal.type === 'monthly' && 'bg-[#8338ec]/10 text-[#8338ec]',
                                            goal.type === 'quarterly' && 'bg-[#ff006e]/10 text-[#ff006e]'
                                        )}>
                                            {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                            Ends {format(goal.endDate.toDate(), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}

                            {activeGoals.length === 0 && !loading && (
                                <p className="text-center text-sm text-text-secondary py-4">
                                    No active goals. Create one to stay focused!
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
