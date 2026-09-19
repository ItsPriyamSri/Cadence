import { useTasks } from './useTasks';

export function useHabits() {
    const { tasks, loading } = useTasks();
    const habits = tasks.filter((t) => t.repeat != null);
    return { habits, loading };
}
