import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Github } from 'lucide-react';
import { RepoInfoPopup } from '@/components/RepoInfoPopup';
import { cn } from '@/lib/utils';

const PryoMark = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pryo-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
    {/* Stylised P shape as a spark/flame */}
    <path
      d="M6 15.5V4.5h5a3.5 3.5 0 0 1 0 7H6"
      stroke="url(#pryo-g)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="14" cy="14.5" r="1.5" fill="#a855f7" opacity="0.7" />
  </svg>
);

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
}

export const DashboardNav = ({
  user,
  project,
  showRepoPopup,
  onTogglePopup,
  onLogout,
  onDisconnect,
}: DashboardNavProps) => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative z-50 flex items-center justify-between gap-4 px-4 md:px-6 py-2 w-full border-b border-white/5 bg-background-dark/80 backdrop-blur-xl"
    >
      {/* Left: Brand */}
      <Link to="/" className="flex items-center gap-2.5 group shrink-0">
        <div className="size-7 rounded-lg bg-gradient-to-br from-primary/25 to-violet-900/40 border border-primary/30 flex items-center justify-center group-hover:border-primary/60 group-hover:shadow-[0_0_12px_rgba(168,85,247,0.25)] transition-all overflow-hidden">
          <PryoMark />
        </div>
        <div className="hidden sm:flex flex-col leading-none">
          <span className="font-display font-bold text-sm tracking-tight text-white">
            Pryo
          </span>
          <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest leading-none mt-0.5">
            A/B Automation
          </span>
        </div>
      </Link>

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
