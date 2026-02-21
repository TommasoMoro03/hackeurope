'use client';

import { LoaderOne } from '@/components/ui/loader';

export function LoadingState() {
  return (
    <div className="min-h-full flex items-center justify-center w-full">
      <div className="flex flex-col items-center gap-6">
        <LoaderOne />
        <p className="text-lg text-neutral-600 dark:text-neutral-400">Loading...</p>
      </div>
    </div>
  );
}
