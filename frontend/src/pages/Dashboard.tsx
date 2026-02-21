import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { DashboardNav } from '@/components/DashboardNav';
import { ExperimentsSidebar } from '@/components/ExperimentsSidebar';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentDetails } from '@/components/ExperimentDetails';

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
  id: number;
  name: string;
  instructions: string;
}

interface Experiment {
  id: number;
  name: string;
  description: string;
  status: string;
  percentage: number;
  metrics: string;
  segments: Segment[];
  created_at: string;
}

interface ExperimentFormData {
  name: string;
  description: string;
  percentage: number;
  numSegments: number;
  metrics: string;
  segments: { name: string; instructions: string }[];
}

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRepoPopup, setShowRepoPopup] = useState(false);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);

  useEffect(() => {
    fetchProject();
    fetchExperiments();
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

  const fetchExperiments = async () => {
    try {
      const response = await api.get('/api/experiments');
      setExperiments(response.data);
    } catch (err: any) {
      console.error('Failed to load experiments:', err);
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

  const handleCreateExperiment = async (formData: ExperimentFormData) => {
    try {
      const response = await api.post('/api/experiments', formData);
      setExperiments([...experiments, response.data]);
      setSelectedExperiment(response.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to create experiment');
      console.error('Error creating experiment:', err);
    }
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
      <DashboardNav
        user={user}
        project={project}
        showRepoPopup={showRepoPopup}
        onTogglePopup={() => setShowRepoPopup(!showRepoPopup)}
        onLogout={logout}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        <ExperimentsSidebar
          experiments={experiments}
          selectedExperiment={selectedExperiment}
          onSelectExperiment={setSelectedExperiment}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {selectedExperiment ? (
            <ExperimentDetails experiment={selectedExperiment} />
          ) : (
            <ExperimentForm onSubmit={handleCreateExperiment} />
          )}
        </div>
      </div>
    </div>
  );
};
