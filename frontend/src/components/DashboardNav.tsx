import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, LogOut, Github, FlaskConical, Plus, ChevronDown, FileText, Play } from 'lucide-react';
import { RepoInfoPopup } from '@/components/RepoInfoPopup';
import { MovingBorder } from '@/components/ui/moving-border';
import { cn } from '@/lib/utils';

interface Project {
  id: number;
  name: string;
  full_name: string;
  github_url: string;
  github_owner: string;
  description: string | null;
  is_private: boolean;
  stars_count: number;
  forks_count: number;
  language: string | null;
  default_branch: string | null;
  created_at: string;
}

interface Experiment {
  id: number;
  name: string;
  status: string;
  description: string;
  percentage: number;
  metrics: string;
  segments: { id: number; name: string; instructions: string; percentage: number }[];
  created_at: string;
}

interface DashboardNavProps {
  user: any;
  project: Project;
  experiments: Experiment[];
  selectedExperiment: Experiment | null;
  experimentView: 'details' | 'live';
  showRepoPopup: boolean;
  onSelectExperiment: (exp: Experiment | null) => void;
  onExperimentViewChange: (view: 'details' | 'live') => void;
  onTogglePopup: () => void;
  onLogout: () => void;
  onDisconnect?: () => Promise<void>;
}

export const DashboardNav = ({
  user,
  project,
  experiments,
  selectedExperiment,
  experimentView,
  showRepoPopup,
  onSelectExperiment,
  onExperimentViewChange,
  onTogglePopup,
  onLogout,
  onDisconnect,
}: DashboardNavProps) => {
  const [expDropdownOpen, setExpDropdownOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative z-50 flex items-center justify-between gap-4 px-4 md:px-6 py-2 w-full border-b border-white/5 bg-background-dark/80 backdrop-blur-xl"
    >
      {/* Left: Brand + Experiments */}
      <div className="flex items-center gap-3 min-w-0">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="size-7 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center group-hover:border-primary/50 transition-colors overflow-hidden">
            <Terminal className="w-3.5 h-3.5 text-primary-glow" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-white hidden sm:inline">Dashboard</span>
        </Link>

        <div className="h-5 w-px bg-white/10 hidden sm:block" />

        {/* Experiment switcher */}
        <div className="relative">
          {selectedExperiment ? (
            <MovingBorder innerClassName="bg-background-dark rounded-lg" className="rounded-lg p-[1px]">
              <button
                onClick={() => setExpDropdownOpen(!expDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider bg-primary/10 text-white hover:bg-primary/20 transition-all w-full"
              >
                <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[140px] md:max-w-[200px]">{selectedExperiment.name}</span>
                <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform', expDropdownOpen && 'rotate-180')} />
              </button>
            </MovingBorder>
          ) : (
            <button
              onClick={() => setExpDropdownOpen(!expDropdownOpen)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-mono uppercase tracking-wider',
                'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07] text-slate-300 hover:text-white'
              )}
            >
              <FlaskConical className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[140px] md:max-w-[200px]">Experiments</span>
              <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 transition-transform', expDropdownOpen && 'rotate-180')} />
            </button>
          )}

          <AnimatePresence>
            {expDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExpDropdownOpen(false)} aria-hidden />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-1.5 z-50 w-64 glass-panel rounded-lg border border-white/10 overflow-hidden shadow-xl"
                >
                  <button
                    onClick={() => {
                      onSelectExperiment(null);
                      setExpDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-4 py-3 text-left text-sm transition-colors',
                      !selectedExperiment ? 'bg-primary/20 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    <span>New experiment</span>
                  </button>
                  {experiments.length > 0 && (
                    <div className="border-t border-white/5 max-h-48 overflow-y-auto">
                      {experiments.map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => {
                            onSelectExperiment(exp);
                            setExpDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full flex flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors',
                            selectedExperiment?.id === exp.id
                              ? 'bg-primary/20 text-white'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          )}
                        >
                          <span className="font-medium text-sm truncate w-full">{exp.name}</span>
                          <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">{exp.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {experiments.length === 0 && (
                    <div className="px-4 py-3 text-xs text-slate-500 border-t border-white/5">No experiments yet</div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Details | Run Test tabs when experiment selected (hide Run Test if failed) */}
        {selectedExperiment && (
          <>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => onExperimentViewChange('details')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all',
                  experimentView === 'details'
                    ? 'bg-primary/30 text-white border border-primary/50'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <FileText className="w-3 h-3" />
                Details
              </button>
              {selectedExperiment.status !== 'failed' && (
                <button
                  onClick={() => onExperimentViewChange('live')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all',
                    experimentView === 'live'
                      ? 'bg-primary/30 text-white border border-primary/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Play className="w-3 h-3" />
                  Run Test
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: Project, user, logout */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <button
            onClick={onTogglePopup}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-[10px] font-mono uppercase tracking-wider',
              'border-white/10 bg-white/5 hover:border-primary/30 hover:bg-primary/10 text-slate-300 hover:text-white'
            )}
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden md:inline truncate max-w-[100px]">{project.name}</span>
            <span className="text-slate-500">⭐ {project.stars_count}</span>
            {project.is_private ? (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[9px]">Private</span>
            ) : (
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[9px]">Public</span>
            )}
          </button>
          {showRepoPopup && (
            <RepoInfoPopup
              project={project}
              onClose={onTogglePopup}
              onDisconnect={onDisconnect}
            />
          )}
        </div>

        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[100px] hidden md:inline">
          {user?.username || user?.email}
        </span>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors text-[10px] font-mono uppercase"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </motion.nav>
  );
};
