import { Note } from '@/lib/firebase/firestore';

/**
 * Cadence notes are stored as a single `content` string (no separate title field).
 * The UI presents a title + body by convention: the first line is the title,
 * everything after it is the body. These helpers split/join without a schema change.
 */

export function splitNote(content: string): { title: string; body: string } {
    const text = content ?? '';
    const nl = text.indexOf('\n');
    if (nl === -1) return { title: text, body: '' };
    return { title: text.slice(0, nl), body: text.slice(nl + 1) };
}

export function noteTitle(note: Pick<Note, 'content'>): string {
    const { title } = splitNote(note.content);
    return title.trim() || 'Untitled note';
}

export function notePreview(note: Pick<Note, 'content'>): string {
    const { body } = splitNote(note.content);
    const preview = body.replace(/\n+/g, ' ').trim();
    return preview || 'No additional text';
}
