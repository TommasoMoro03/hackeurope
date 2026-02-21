'use client';

import { SessionProvider } from 'next-auth/react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { cn } from '@/lib/utils';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div
        className={cn(
          'flex w-full flex-1 flex-col overflow-hidden md:flex-row bg-gray-100 dark:bg-neutral-800',
          'h-screen'
        )}
      >
        <AppSidebar />
        <div className="flex flex-1 min-w-0">
          <div className="flex h-full w-full flex-1 flex-col gap-2 border-l border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900 overflow-auto p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
