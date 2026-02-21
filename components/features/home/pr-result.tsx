'use client';

import { Button } from '@/components/ui/button';

interface PrResultProps {
  prUrl: string;
  onMarkMerged: () => void;
}

export function PrResult({ prUrl, onMarkMerged }: PrResultProps) {
  return (
    <div className="mt-6 p-4 md:p-5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <h3 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">
        Pull Request Created!
      </h3>
      <a
        href={prUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-600 hover:underline block mb-4 break-all font-mono text-sm"
      >
        {prUrl}
      </a>
      <Button
        variant="secondary"
        onClick={onMarkMerged}
        className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
      >
        Mark as Merged
      </Button>
    </div>
  );
}
