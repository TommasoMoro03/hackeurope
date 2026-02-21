'use client';

import { Button } from '@/components/ui/button';
import { LoaderOne } from '@/components/ui/loader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconRefresh } from '@tabler/icons-react';
import type { Repository } from '@/types';

interface RepositoryListProps {
  repos: Repository[];
  loadingRepos: boolean;
  onRefresh: () => void;
  onSelectRepo: (repo: Repository) => void;
}

export function RepositoryList({
  repos,
  loadingRepos,
  onRefresh,
  onSelectRepo,
}: RepositoryListProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Select a Repository
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loadingRepos}
          className="gap-2"
        >
          <IconRefresh className={`h-4 w-4 ${loadingRepos ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loadingRepos ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <LoaderOne />
          <p className="text-neutral-500 dark:text-neutral-400">
            Loading your repositories...
          </p>
        </div>
      ) : repos.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          No repositories found with write access.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {repos.map((repo) => (
            <Card
              key={repo.id}
              className="group hover:border-neutral-400 dark:hover:border-neutral-500 cursor-pointer transition-colors"
              onClick={() => onSelectRepo(repo)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-500 transition-colors">
                    {repo.name}
                  </CardTitle>
                  {repo.private && (
                    <span className="shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs rounded-full font-medium">
                      Private
                    </span>
                  )}
                </div>
                <CardDescription className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                  {repo.fullName}
                </CardDescription>
              </CardHeader>
              {repo.description && (
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2">
                    {repo.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
