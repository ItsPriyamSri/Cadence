import {
    format,
    formatDistanceToNow,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfDay,
    endOfDay,
    addDays,
    subDays,
    isToday,
    isTomorrow,
    isYesterday,
    parseISO,
} from 'date-fns';

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
}

/**
 * Format a date for display (e.g., "Monday, January 5")
 */
export function formatDisplayDate(date: Date): string {
    return format(date, 'EEEE, MMMM d');
}

/**
 * Format a date in short form (e.g., "Jan 5")
 */
export function formatShortDate(date: Date): string {
    return format(date, 'MMM d');
}

/**
 * Format a time (e.g., "9:00 AM")
 */
export function formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return format(date, 'h:mm a');
}

/**
 * Format elapsed time in human-readable format
 */
export function formatElapsed(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get relative date label (Today, Tomorrow, Yesterday, or formatted date)
 */
export function getRelativeDateLabel(date: Date | string): string {
    const d = typeof date === 'string' ? parseISO(date) : date;

    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    if (isYesterday(d)) return 'Yesterday';

    return format(d, 'MMM d');
}

/**
 * Generate hour slots for a day (e.g., 6 AM to 11 PM)
 */
export function generateHourSlots(startHour: number = 6, endHour: number = 23): number[] {
    const hours: number[] = [];
    for (let i = startHour; i <= endHour; i++) {
        hours.push(i);
    }
    return hours;
}

/**
 * Format hour for display (e.g., "9 AM")
 */
export function formatHour(hour: number): string {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return format(date, 'h a');
}

/**
 * Get week date range
 */
export function getWeekRange(date: Date = new Date()) {
    return {
        start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(date, { weekStartsOn: 1 }),
    };
}

/**
 * Get month date range
 */
export function getMonthRange(date: Date = new Date()) {
    return {
        start: startOfMonth(date),
        end: endOfMonth(date),
    };
}

/**
 * Get days in a week from a starting date
 */
export function getWeekDays(startDate: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        days.push(addDays(startDate, i));
    }
    return days;
}

/**
 * Format distance to now (e.g., "5 minutes ago")
 */
export function formatTimeAgo(date: Date): string {
    return formatDistanceToNow(date, { addSuffix: true });
}

// Re-export commonly used date-fns functions
export {
    format,
    parseISO,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfDay,
    endOfDay,
    addDays,
    subDays,
    isToday,
    isTomorrow,
    isYesterday,
};
