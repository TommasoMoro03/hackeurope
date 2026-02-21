import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Terminal, Lock, Star, GitFork, ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { api } from '@/lib/axios';
import { projectCache } from '@/services/projectCache.service';
import { AppBackground } from '@/components/ui/app-background';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Card } from '@/components/ui/card-hover-effect';

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

      const { data: linkedProject } = await api.post('/api/github/project/link', {
        repo_id: repo.id,
        access_token: accessToken
      });

      projectCache.set(linkedProject);
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
      <AppBackground>
        <Navbar
          brandIcon={<Terminal className="w-4 h-4 text-white" />}
          status={{ label: 'Loading', pulseColor: 'bg-amber-500' }}
        />
        <main className="flex-1 relative z-20 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] uppercase tracking-widest font-semibold text-primary-glow mb-4">
                  <Github className="w-3 h-3" />
                  Integration Protocol
                </div>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
                  Synchronize <br />
                  <span className="italic text-primary-glow">Codebase</span>
                </h1>
                <p className="font-display text-slate-400 max-w-md text-base md:text-lg font-light leading-relaxed pt-2">
                  Establishing secure link with your repository...
                </p>
              </div>
            </motion.div>
            <GlassPanel title="github — link" className="w-full max-w-md">
              <div className="p-6 md:p-8 space-y-6 font-mono text-sm">
                <div className="space-y-2 text-slate-400 text-xs md:text-sm">
                  <p className="terminal-line">linking repo for auto-PR on winners</p>
                  <p className="terminal-line text-emerald-400/80">loading your repositories...</p>
                </div>
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-1 w-28 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-1/3 bg-primary rounded-full animate-loading-bar" />
                  </div>
                  <p className="text-slate-500 text-xs">Loading repositories...</p>
                </div>
              </div>
            </GlassPanel>
          </div>
        </main>
      </AppBackground>
    );
  }

  if (error) {
    return (
      <AppBackground>
        <Navbar brandIcon={<Terminal className="w-4 h-4 text-white" />} />
        <main className="flex-1 relative z-20 flex items-center justify-center p-6">
          <GlassPanel title="error" className="w-full max-w-md">
            <div className="p-8">
              <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
              <p className="text-slate-400 mb-6 text-sm">{error}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-primary hover:bg-primary-glow text-white font-mono font-bold py-3 px-6 rounded glow-button flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </GlassPanel>
        </main>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      {/* Nav */}
      <Navbar
        brandIcon={<Terminal className="w-4 h-4 text-white" />}
        status={{ label: 'Repos Loaded' }}
      />

      {/* Main */}
      <main className="flex-1 relative z-20 p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8 lg:sticky lg:top-24"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] uppercase tracking-widest font-semibold text-primary-glow mb-4">
                <Github className="w-3 h-3" />
                Integration Protocol
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
                Synchronize <br />
                <span className="italic text-primary-glow">Codebase</span>
              </h1>
              <p className="font-display text-slate-400 max-w-md text-base md:text-lg font-light leading-relaxed pt-2">
                Link your repo so we can auto-open PRs when a variant wins your A/B test. Read/write access required.
              </p>
            </div>
            <div className="space-y-4 pt-4 border-l border-white/10 pl-6">
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Requirement</span>
                <span className="text-sm text-slate-300">Read/Write access to repository</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Security</span>
                <span className="text-sm text-slate-300">256-bit Encrypted Token Exchange</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Repo grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {repos.length === 0 ? (
              <GlassPanel title="github — no repos">
                <div className="p-8 text-center">
                  <p className="text-slate-400 mb-4">No repositories found with write access.</p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-primary hover:bg-primary-glow text-white font-mono font-bold py-3 px-6 rounded glow-button"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </GlassPanel>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                  Select repository to link
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {repos.map((repo, i) => (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card
                        onClick={() => !linking && handleSelectRepo(repo)}
                        className={linking ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-semibold text-white group-hover:text-primary-glow transition-colors truncate">
                            {repo.name}
                          </h3>
                          {repo.private && (
                            <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                              <Lock className="w-3 h-3" />
                              Private
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{repo.full_name}</p>
                        {repo.description && (
                          <p className="text-sm text-slate-400 line-clamp-2">{repo.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-auto">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-primary" />
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {repo.stars_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="w-3 h-3" />
                            {repo.forks_count}
                          </span>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/5 py-4 px-6 md:px-8 flex justify-between items-center bg-background-dark/80 backdrop-blur">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-slate-500 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex gap-2">
          <div className="h-1 w-8 bg-white/10 rounded-full" />
          <div className="h-1 w-8 bg-primary rounded-full" />
          <div className="h-1 w-8 bg-white/10 rounded-full" />
        </div>
      </footer>
    </AppBackground>
  );
};
