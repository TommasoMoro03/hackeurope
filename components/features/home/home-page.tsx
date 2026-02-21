'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/features/home/auth-gate';
import { LoadingState } from '@/components/features/home/loading-state';
import { PromptForm } from '@/components/features/home/prompt-form';
import { PrResult } from '@/components/features/home/pr-result';
import { RepositoryList } from '@/components/features/home/repository-list';
import { StatusMessage } from '@/components/features/home/status-message';
import type { Repository, UiMessage } from '@/types';

export function HomePage() {
  const { data: session, status } = useSession();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<UiMessage | null>(null);

  useEffect(() => {
    if (session) {
      void fetchRepositories();
    }
  }, [session]);

  const fetchRepositories = async () => {
    setLoadingRepos(true);
    setMessage(null);

    try {
      const response = await fetch('/api/repos');
      const data = await response.json();

      if (response.ok) {
        setRepos(data.repos);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch repositories' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch repositories from GitHub' });
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo);
    setPrUrl(null);
    setPrompt('');
    setMessage({ type: 'success', text: `Selected ${repo.fullName}` });
  };

  const handleSubmitPrompt = async () => {
    if (!selectedRepo || !prompt) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setPrUrl(null);

    try {
      const response = await fetch('/api/apply-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: selectedRepo.owner,
          repo: selectedRepo.name,
          prompt,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPrUrl(data.prUrl);
        setMessage({ type: 'success', text: 'Pull request created successfully!' });
        setPrompt('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create PR' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while processing your request' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedRepo(null);
    setPrUrl(null);
    setPrompt('');
    setMessage(null);
  };

  const handleMarkMerged = () => {
    setPrUrl(null);
    setMessage({ type: 'success', text: 'PR marked as merged!' });
  };

  if (status === 'loading') {
    return <LoadingState />;
  }

  if (!session) {
    return <AuthGate onSignIn={() => signIn('github')} />;
  }

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            GitHub AI Agent
          </h1>
        </div>

        {message && <StatusMessage message={message} />}

        {!selectedRepo ? (
          <RepositoryList
            repos={repos}
            loadingRepos={loadingRepos}
            onRefresh={fetchRepositories}
            onSelectRepo={handleSelectRepo}
          />
        ) : (
          <div>
            <PromptForm
              selectedRepo={selectedRepo}
              prompt={prompt}
              isSubmitting={isSubmitting}
              onPromptChange={setPrompt}
              onSubmit={handleSubmitPrompt}
              onClearSelection={handleClearSelection}
            />

            {prUrl && <PrResult prUrl={prUrl} onMarkMerged={handleMarkMerged} />}
          </div>
        )}
      </div>
    </div>
  );
}
