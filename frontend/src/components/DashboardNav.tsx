import { Button } from '@/components/Button';
import { RepoInfoPopup } from '@/components/RepoInfoPopup';

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
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <div className="relative">
              <button
                onClick={onTogglePopup}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                <span className="font-medium text-gray-700">{project.name}</span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  ⭐ {project.stars_count}
                </span>
                {project.is_private ? (
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Private</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Public</span>
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
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.username || user?.email}</span>
            <Button onClick={onLogout} variant="outline">Logout</Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
