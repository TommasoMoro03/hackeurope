import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, LogOut, Github } from 'lucide-react';
import { RepoInfoPopup } from '@/components/RepoInfoPopup';
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

interface DashboardNavProps {
  user: any;
  project: Project;
  showRepoPopup: boolean;
  onTogglePopup: () => void;
  onLogout: () => void;
  onDisconnect?: () => Promise<void>;
  onSwitchRepository?: () => Promise<void>;
}

export const DashboardNav = ({
  user,
  project,
  showRepoPopup,
  onTogglePopup,
  onLogout,
  onDisconnect,
  onSwitchRepository,
}: DashboardNavProps) => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative z-50 flex items-center justify-between px-4 md:px-6 py-2.5 w-full border-b border-white/5 bg-background-dark/60 backdrop-blur-md"
    >
      <Link to="/" className="flex items-center gap-2 group shrink-0">
        <div className="size-6 bg-white/5 rounded border border-white/10 flex items-center justify-center group-hover:border-primary/30 transition-colors overflow-hidden">
          <Terminal className="w-3 h-3 text-white" />
        </div>
        <span className="font-display font-bold text-sm tracking-tight text-white hidden sm:inline">Dashboard</span>
      </Link>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={onTogglePopup}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-[10px] font-mono uppercase tracking-wider',
              'border-white/10 bg-white/5 hover:border-primary/30 hover:bg-primary/10 text-slate-300 hover:text-white'
            )}
          >
            <Github className="w-4 h-4" />
            <span>{project.name}</span>
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
              onSwitchRepository={onSwitchRepository}
            />
          )}
        </div>

        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px] md:max-w-none">
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
