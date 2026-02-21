'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

interface Repository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
  private: boolean;
  url: string;
}

function HomePage() {
  const { data: session, status } = useSession();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch repositories when user signs in
  useEffect(() => {
    if (session) {
      fetchRepositories();
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
    } catch (error) {
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
    if (!selectedRepo || !prompt) return;

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
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while processing your request' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkMerged = () => {
    setPrUrl(null);
    setMessage({ type: 'success', text: 'PR marked as merged!' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-3xl font-bold mb-4 text-center">GitHub AI Agent</h1>
          <p className="mb-6 text-gray-600 text-center">
            Connect your GitHub account to get started
          </p>
          <button
            onClick={() => signIn('github')}
            className="w-full bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">GitHub AI Agent</h1>
            <button
              onClick={() => signOut()}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Sign out
            </button>
          </div>

          {message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {!selectedRepo ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Select a Repository</h2>
                <button
                  onClick={fetchRepositories}
                  disabled={loadingRepos}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {loadingRepos ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {loadingRepos ? (
                <div className="text-center py-8 text-gray-500">
                  Loading your repositories...
                </div>
              ) : repos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No repositories found with write access.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {repos.map((repo) => (
                    <div
                      key={repo.id}
                      onClick={() => handleSelectRepo(repo)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{repo.name}</h3>
                          <p className="text-sm text-gray-600">{repo.fullName}</p>
                          {repo.description && (
                            <p className="text-sm text-gray-500 mt-1">{repo.description}</p>
                          )}
                        </div>
                        {repo.private && (
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Selected: {selectedRepo.fullName}
                </h2>
                <button
                  onClick={() => {
                    setSelectedRepo(null);
                    setPrUrl(null);
                    setPrompt('');
                    setMessage(null);
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Choose Different Repo
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to change?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Add a README file explaining the project setup..."
                  className="w-full border border-gray-300 rounded-md px-4 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              <button
                onClick={handleSubmitPrompt}
                disabled={!prompt || isSubmitting}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : 'Submit & Create PR'}
              </button>

              {prUrl && (
                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                  <h3 className="font-semibold mb-2">Pull Request Created!</h3>
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline block mb-4"
                  >
                    {prUrl}
                  </a>
                  <button
                    onClick={handleMarkMerged}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Mark as Merged
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <SessionProvider>
      <HomePage />
    </SessionProvider>
  );
}
