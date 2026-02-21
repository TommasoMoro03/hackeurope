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
}

export const RepoInfoPopup = ({ project, onClose }: RepoInfoPopupProps) => {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      <div className="absolute left-0 top-12 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
        <div className="space-y-3">
          <div>
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              {project.full_name}
            </a>
          </div>

          {project.description && (
            <p className="text-sm text-gray-600">{project.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            {project.language && (
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                {project.language}
              </span>
            )}
            <span>⭐ {project.stars_count}</span>
            <span>🍴 {project.forks_count}</span>
          </div>

          {project.default_branch && (
            <div className="text-sm">
              <span className="text-gray-500">Default branch: </span>
              <span className="font-mono text-gray-700">{project.default_branch}</span>
            </div>
          )}

          <div className="text-xs text-gray-400 pt-2 border-t">
            Linked {new Date(project.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </>
  );
};
