import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { api } from '@/lib/axios';

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
      // Exchange code for token
      const callbackResponse = await api.get(`/api/github/callback?code=${code}`);
      const accessToken = callbackResponse.data.access_token;

      // Fetch repos
      const reposResponse = await api.get(`/api/github/repos?access_token=${accessToken}`);
      setRepos(reposResponse.data.repos);

      // Store access token temporarily in session storage
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

      // Clear token from session storage
      sessionStorage.removeItem('github_access_token');

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to link repository');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading repositories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Select a Repository</h1>
          <p className="mt-2 text-gray-600">
            Choose a repository to link to your project. You'll be able to track experiments and analytics for this repository.
          </p>
        </div>

        {repos.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-600">No repositories found with write access.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="bg-white shadow rounded-lg p-5 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => !linking && handleSelectRepo(repo)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {repo.name}
                  </h3>
                  {repo.private && (
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                      Private
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 mb-3 truncate">{repo.full_name}</p>

                {repo.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{repo.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {repo.language && (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      {repo.language}
                    </span>
                  )}
                  <span>⭐ {repo.stars_count}</span>
                  <span>🍴 {repo.forks_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
