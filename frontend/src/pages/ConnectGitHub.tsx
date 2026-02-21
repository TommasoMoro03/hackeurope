import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Terminal, ArrowRight } from 'lucide-react';
import { api } from '@/lib/axios';
import { Navbar } from '@/components/ui/navbar';
import { AppBackground } from '@/components/ui/app-background';
import { GlassPanel } from '@/components/ui/glass-panel';

export const ConnectGitHub = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/api/github/link');
      window.location.href = response.data.auth_url;
    } catch (err) {
      setError('Failed to initiate GitHub connection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppBackground>
      <Navbar
        brandIcon={<Terminal className="w-4 h-4 text-white" />}
        status={{ label: 'Step 01/03' }}
      />

      <main className="flex-1 relative z-20 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8 order-2 lg:order-1"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] uppercase tracking-widest font-semibold text-primary-glow mb-4">
                <Github className="w-3 h-3" />
                Integration Protocol
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
                Connect <br />
                <span className="italic text-primary-glow">GitHub</span>
              </h1>
              <p className="font-display text-slate-400 max-w-md text-base md:text-lg font-light leading-relaxed pt-2">
                Link your repository so we can auto-open PRs when a variant wins your A/B test. Read/write access required.
              </p>
              <p className="font-display text-slate-400 max-w-md text-base font-light leading-relaxed pt-4 border-l border-white/10 pl-6">
                Let AI do the subtle variations—as you see your conversions increase.
              </p>
            </div>
          </motion.div>

          {/* Right: Glass panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="order-1 lg:order-2 w-full flex justify-center lg:justify-end"
          >
            <GlassPanel title="github — connect" className="w-full max-w-md">
              <div className="p-6 md:p-8 space-y-6 font-mono text-sm relative">
                <div className="space-y-2 text-slate-400 text-xs md:text-sm">
                  <p className="terminal-line">linking repo for auto-PR on winners</p>
                  <p className="terminal-line text-emerald-400/80">authorize with GitHub to continue</p>
                </div>

                <div className="bg-black/20 rounded-lg border border-white/5 p-6 flex flex-col items-center gap-4">
                  <div className="size-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
                    <Github className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold mb-1">GitHub Integration</h3>
                    <p className="text-xs text-slate-500">Allow access to your repositories</p>
                  </div>
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}
                  <button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="w-full mt-2 bg-primary hover:bg-primary-glow text-white font-mono font-bold py-3 px-6 rounded glow-button flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </span>
                    ) : (
                      <>
                        <span>Connect GitHub</span>
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/dashboard"
            className="text-sm text-slate-500 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </AppBackground>
  );
};
