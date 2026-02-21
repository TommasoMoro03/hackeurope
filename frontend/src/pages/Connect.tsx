import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, ArrowRight, ArrowLeft } from 'lucide-react';
import { MovingBorderButton } from '@/components/ui/moving-border';

const GitHubLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const Connect = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);

  const handleAuthorize = () => setIsConnected(true);
  const handleContinue = () => navigate('/experiments/new');

  return (
    <div className="min-h-screen bg-background-dark font-mono text-slate-300 flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 scanline z-10 opacity-20" />
      </div>

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-8 py-6 border-b border-white/5 bg-background-dark/50 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-3">
          <div className="size-8 bg-white/5 rounded border border-white/10 flex items-center justify-center">
            <Terminal className="text-white size-4" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">Vibe_Terminal</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-6 text-[10px] uppercase font-mono tracking-widest text-slate-500">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Active</span>
          </div>
          <span>Step 02/03</span>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 relative z-20 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <section className="space-y-8 order-2 lg:order-1">
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-[10px] uppercase tracking-widest font-semibold text-primary-glow mb-4"
              >
                Integration Protocol
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-serif text-5xl md:text-6xl text-white leading-tight"
              >
                Synchronize <br />
                <span className="italic text-primary-glow">Codebase</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-slate-400 max-w-md text-lg font-light leading-relaxed pt-2"
              >
                Establish a secure link with your repository to enable automated PR generation for winning variants.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4 pt-4 border-l border-white/10 pl-6"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Requirement</span>
                <span className="text-sm text-slate-300">Read/Write access to repository</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Security</span>
                <span className="text-sm text-slate-300">256-bit Encrypted Token Exchange</span>
              </div>
            </motion.div>
          </section>

          {/* Right - Terminal panel */}
          <section className="order-1 lg:order-2 w-full flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel w-full max-w-md rounded-xl overflow-hidden relative group"
            >
              <div className="bg-black/40 px-4 py-3 flex items-center justify-between border-b border-white/5">
                <div className="flex gap-2">
                  <span className="size-3 rounded-full bg-red-500/20 border border-red-500/50" />
                  <span className="size-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                  <span className="size-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">bash — vibe-cli</span>
              </div>
              <div className="p-6 md:p-8 space-y-6 font-mono text-sm relative">
                <div className="space-y-2 text-slate-400 text-xs md:text-sm">
                  <p className="terminal-line">initializing handshake sequence...</p>
                  <p className="terminal-line">detecting providers...</p>
                  <p className="terminal-line text-emerald-400/80">found: github_enterprise</p>
                  <p className="terminal-line">awaiting authorization...</p>
                </div>
                <div className="bg-black/20 rounded-lg border border-white/5 p-6 flex flex-col items-center gap-4 mt-8">
                  <div className="size-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors duration-500">
                    <GitHubLogo className="size-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold mb-1">GitHub Integration</h3>
                    <p className="text-xs text-slate-500">Allow Vibe A/B to access your repositories</p>
                  </div>
                  {!isConnected ? (
                    <button
                      onClick={handleAuthorize}
                      className="w-full mt-2 bg-primary hover:bg-primary-glow text-white font-mono font-bold py-3 px-6 rounded glow-button flex items-center justify-center gap-2 group/btn"
                    >
                      <span>Authorize Access</span>
                      <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <MovingBorderButton
                      as="button"
                      onClick={handleContinue}
                      containerClassName="w-full mt-2"
                      className="font-mono"
                    >
                      Continue to Step 3 →
                    </MovingBorderButton>
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase text-slate-600 font-bold tracking-widest pt-2">
                  <span>Connection: {isConnected ? 'Active' : 'Idle'}</span>
                  <span>Latency: 12ms</span>
                </div>
                <div className="absolute bottom-4 left-6 h-4 w-2 bg-primary/50 animate-pulse" />
              </div>
            </motion.div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/5 py-6 px-6 md:px-8 flex justify-between items-center bg-background-dark/80 backdrop-blur">
        <Link
          to="/dashboard"
          className="text-slate-500 hover:text-white font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="size-3" />
          Back
        </Link>
        <div className="flex gap-2">
          <div className="h-1 w-8 bg-primary rounded-full" />
          <div className="h-1 w-8 bg-primary rounded-full" />
          <div className="h-1 w-8 bg-white/10 rounded-full" />
        </div>
        <span className="text-slate-500 font-mono text-xs uppercase tracking-widest opacity-50 cursor-not-allowed flex items-center gap-2">
          Skip
        </span>
      </footer>
    </div>
  );
};
