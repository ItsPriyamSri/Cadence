import { CheckSquare, Calendar, FileText, LucideIcon } from 'lucide-react';

export interface NavItem {
    href: string;
    tab: 'tasks' | 'calendar' | 'notes';
    label: string;
    icon: LucideIcon;
}

export const navItems: NavItem[] = [
    { href: '/tasks', tab: 'tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/calendar', tab: 'calendar', label: 'Calendar', icon: Calendar },
    { href: '/notes', tab: 'notes', label: 'Notes', icon: FileText },
];

export const pageMeta: Record<NavItem['tab'], { title: string; subtitle: string }> = {
    tasks: { title: 'Tasks', subtitle: 'Start something. Momentum follows.' },
    calendar: { title: 'Calendar', subtitle: 'Plan and time-block your day.' },
    notes: { title: 'Brain Dump', subtitle: 'Capture thoughts and track goals.' },
};

export function tabFromPathname(pathname: string): NavItem['tab'] {
    if (pathname.startsWith('/calendar')) return 'calendar';
    if (pathname.startsWith('/notes')) return 'notes';
    return 'tasks';
}
