'use client';

import { Button } from '@/components/ui/button';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import type { Repository } from '@/types';

const PROMPT_PLACEHOLDERS = [
  'Add a README explaining the project setup...',
  'Create a new API endpoint for user profile...',
  'Fix the login form validation and add error messages...',
  'Add unit tests for the checkout flow...',
  'Update dependencies and fix breaking changes...',
];

interface PromptFormProps {
  selectedRepo: Repository;
  prompt: string;
  isSubmitting: boolean;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onClearSelection: () => void;
}

export function PromptForm({
  selectedRepo,
  prompt,
  isSubmitting,
  onPromptChange,
  onSubmit,
  onClearSelection,
}: PromptFormProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Selected: {selectedRepo.fullName}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          Choose Different Repo
        </Button>
      </div>

      <div className="mb-6 space-y-4">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          What would you like to change?
        </label>
        <PlaceholdersAndVanishInput
          placeholders={PROMPT_PLACEHOLDERS}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
}
