import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
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

interface Segment {
  name: string;
  instructions: string;
}

interface ExperimentForm {
  name: string;
  description: string;
  percentage: number;
  numSegments: number;
  metrics: string;
  segments: Segment[];
}

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRepoPopup, setShowRepoPopup] = useState(false);
  const [experiments] = useState<any[]>([]);

  const [form, setForm] = useState<ExperimentForm>({
    name: '',
    description: '',
    percentage: 100,
    numSegments: 2,
    metrics: '',
    segments: [
      { name: '', instructions: '' },
      { name: '', instructions: '' },
    ],
  });

  useEffect(() => {
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/github/project');
      setProject(response.data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setProject(null);
        setError(null);
      } else {
        setError('Failed to load project');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGitHub = async () => {
    try {
      const response = await api.get('/api/github/link');
      window.location.href = response.data.auth_url;
    } catch (err) {
      setError('Failed to initiate GitHub linking');
    }
  };

  const handleNumSegmentsChange = (num: number) => {
    const newSegments = Array.from({ length: num }, (_, i) =>
      form.segments[i] || { name: '', instructions: '' }
    );
    setForm({ ...form, numSegments: num, segments: newSegments });
  };

  const handleSegmentChange = (index: number, field: 'name' | 'instructions', value: string) => {
    const newSegments = [...form.segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setForm({ ...form, segments: newSegments });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Experiment form:', form);
    // TODO: Submit to backend
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">{user?.username || user?.email}</span>
                <Button onClick={logout} variant="outline">Logout</Button>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Link Your Repository</h2>
              <p className="text-gray-600 mb-6">
                Connect your GitHub repository to get started with experiments and analytics.
              </p>
              <Button onClick={handleLinkGitHub}>Link GitHub Repository</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
              <div className="relative">
                <button
                  onClick={() => setShowRepoPopup(!showRepoPopup)}
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
                  <RepoInfoPopup project={project} onClose={() => setShowRepoPopup(false)} />
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{user?.username || user?.email}</span>
              <Button onClick={logout} variant="outline">Logout</Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Experiments</h2>
            {experiments.length === 0 ? (
              <p className="text-sm text-gray-500">No experiments yet</p>
            ) : (
              <div className="space-y-2">
                {experiments.map((exp) => (
                  <div key={exp.id} className="p-3 rounded hover:bg-gray-50 cursor-pointer">
                    <div className="font-medium text-gray-900">{exp.name}</div>
                    <div className="text-xs text-gray-500">{exp.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {experiments.length === 0 ? (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Experiment</h2>
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Percentage of Users Involved</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.percentage}
                    onChange={(e) => setForm({ ...form, percentage: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Segments</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={form.numSegments}
                    onChange={(e) => handleNumSegmentsChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metrics</label>
                  <textarea
                    value={form.metrics}
                    onChange={(e) => setForm({ ...form, metrics: e.target.value })}
                    rows={3}
                    placeholder="Define metrics to track..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Segments</h3>
                  {form.segments.map((segment, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Segment {index + 1}</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <input
                            type="text"
                            value={segment.name}
                            onChange={(e) => handleSegmentChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                          <textarea
                            value={segment.instructions}
                            onChange={(e) => handleSegmentChange(index, 'instructions', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit">Create Experiment</Button>
              </form>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select an experiment from the sidebar</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
