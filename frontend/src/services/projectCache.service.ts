const CACHE_KEY = 'github_project_cache';

export interface CachedProject {
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

export const projectCache = {
  get(): CachedProject | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? (JSON.parse(cached) as CachedProject) : null;
    } catch {
      return null;
    }
  },

  set(project: CachedProject): void {
    localStorage.setItem(CACHE_KEY, JSON.stringify(project));
  },

  clear(): void {
    localStorage.removeItem(CACHE_KEY);
  },
};
