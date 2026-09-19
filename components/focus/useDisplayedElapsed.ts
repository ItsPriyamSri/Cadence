'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/firebase/firestore';
import { displayedElapsedMs } from '@/lib/habits/logic';

export function useDisplayedElapsed(
    task:
        | {
              id?: string;
              status: Task['status'];
              elapsedMs: number;
              startedAt: { toMillis?: () => number } | number | null;
          }
        | null
        | undefined
): number {
    const [nowMs, setNowMs] = useState(Date.now());

    const isStarted = task?.status === 'started';
    const startedAt = task?.startedAt;
    const elapsedMs = task?.elapsedMs ?? 0;
    const taskId = task?.id;
    const status = task?.status;

    useEffect(() => {
        if (!isStarted) return;
        setNowMs(Date.now());
        const interval = setInterval(() => {
            setNowMs(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, [isStarted, taskId, startedAt, status]);

    if (!task) return 0;

    const totalMs = displayedElapsedMs(task, nowMs);
    return Math.floor(totalMs / 1000);
}
