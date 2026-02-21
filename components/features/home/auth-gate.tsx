'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconBrandGithub } from '@tabler/icons-react';

interface AuthGateProps {
  onSignIn: () => void;
}

export function AuthGate({ onSignIn }: AuthGateProps) {
  return (
    <div className="min-h-full flex items-center justify-center w-full">
      <Card className="max-w-md w-full p-6 text-center">
        <h1 className="text-3xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
          GitHub AI Agent
        </h1>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">
          Connect your GitHub account to get started
        </p>
        <Button className="w-full gap-2" onClick={onSignIn}>
          <IconBrandGithub className="h-4 w-4" />
          Sign in with GitHub
        </Button>
      </Card>
    </div>
  );
}
