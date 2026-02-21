import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/axios';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Card } from '@/components/ui/card-hover-effect';
import { Github, Lock, Star, GitFork } from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  description: string | null;
  private: boolean;
  url: string;
  stars_count: number;
  forks_count: number;
  language: string | null;
}

export const LinkRepository = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      handleOAuthCallback(code);
    } else {
      setError('No authorization code found');
      setLoading(false);
    }
  }, [searchParams]);

  const handleOAuthCallback = async (code: string) => {
    try {
      setLoading(true);
      const callbackResponse = await api.get(`/api/github/callback?code=${code}`);
      const accessToken = callbackResponse.data.access_token;

      const reposResponse = await api.get(`/api/github/repos?access_token=${accessToken}`);
      setRepos(reposResponse.data.repos);

      sessionStorage.setItem('github_access_token', accessToken);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = async (repo: Repository) => {
    try {
      setLinking(true);
      const accessToken = sessionStorage.getItem('github_access_token');

      if (!accessToken) {
        setError('Access token not found. Please try again.');
        return;
      }

      await api.post('/api/github/project/link', {
        repo_id: repo.id,
        access_token: accessToken
      });

      sessionStorage.removeItem('github_access_token');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to link repository');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <AuroraBackground className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 text-center"
        >
          <div className="h-12 w-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-zinc-400">Loading repositories...</p>
        </motion.div>
      </AuroraBackground>
    );
  }

  if (error) {
    return (
      <AuroraBackground className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 rounded-2xl border border-red-500/30 bg-zinc-900/90 backdrop-blur-xl p-8 max-w-md"
        >
          <h2 className="text-xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-zinc-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground className="min-h-screen py-12">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Github className="w-8 h-8 text-violet-400" />
            Select a Repository
          </h1>
          <p className="mt-2 text-zinc-400">
            Choose a repository to link to your project. You&apos;ll be able to track experiments and analytics for this repository.
          </p>
        </motion.div>

        {repos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-zinc-700/50 bg-zinc-900/50 p-12 text-center"
          >
            <p className="text-zinc-400 mb-4">No repositories found with write access.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repos.map((repo, i) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  onClick={() => !linking && handleSelectRepo(repo)}
                  className={linking ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors truncate">
                      {repo.name}
                    </h3>
                    {repo.private && (
                      <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-zinc-500 truncate">{repo.full_name}</p>

                  {repo.description && (
                    <p className="text-sm text-zinc-400 line-clamp-2">{repo.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-zinc-500 mt-auto">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-violet-500" />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {repo.stars_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5" />
                      {repo.forks_count}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AuroraBackground>
  );
};
