import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

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

interface RepoInfoPopupProps {
  project: Project;
  onClose: () => void;
  onDisconnect?: () => Promise<void>;
}

export const RepoInfoPopup = ({
  project,
  onClose,
  onDisconnect,
}: RepoInfoPopupProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    setIsLoading(true);
    try {
      await onDisconnect();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div className="absolute left-0 top-full mt-2 z-50 w-72 glass-panel rounded-lg border border-white/10 p-4 shadow-xl">
        <div className="space-y-3">
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary-glow hover:text-primary font-semibold font-mono text-sm transition-colors"
          >
            {project.full_name}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {project.description && (
            <p className="text-sm text-slate-400">{project.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-slate-500">
            {project.language && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {project.language}
              </span>
            )}
            <span>⭐ {project.stars_count}</span>
            <span>🍴 {project.forks_count}</span>
          </div>

          {project.default_branch && (
            <div className="text-sm">
              <span className="text-slate-500">Branch: </span>
              <span className="font-mono text-slate-300">{project.default_branch}</span>
            </div>
          )}

          <div className="text-xs text-slate-600 pt-2 border-t border-white/5">
            Linked {new Date(project.created_at).toLocaleDateString()}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {onDisconnect && (
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm font-mono text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/30 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
