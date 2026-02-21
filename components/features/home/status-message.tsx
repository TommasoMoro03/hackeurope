'use client';

import type { UiMessage } from '@/types';

interface StatusMessageProps {
  message: UiMessage;
}

export function StatusMessage({ message }: StatusMessageProps) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        message.type === 'success'
          ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/20'
          : 'bg-red-500/10 text-red-800 dark:text-red-200 border-red-500/20'
      }`}
    >
      {message.text}
    </div>
  );
}
