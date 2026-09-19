export const HABIT_PALETTE = [
    '#ef4444',
    '#3b82f6',
    '#22c55e',
    '#a855f7',
    '#f59e0b',
    '#06b6d4',
    '#ec4899',
    '#f97316',
] as const;

export function nextHabitColor(existingHexes: string[]): string {
    const used = new Set(existingHexes.map((c) => c.toLowerCase()));
    const found = HABIT_PALETTE.find((c) => !used.has(c.toLowerCase()));
    if (found) return found;
    return HABIT_PALETTE[existingHexes.length % HABIT_PALETTE.length];
}
