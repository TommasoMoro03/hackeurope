import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { DashboardNav } from '@/components/DashboardNav';
import { ExperimentsSidebar } from '@/components/ExperimentsSidebar';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentDetails } from '@/components/ExperimentDetails';
import { ExperimentProgress } from '@/components/ExperimentProgress';

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
  percentage: number;
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
  segments: { name: string; instructions: string; percentage: number }[];
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRepoPopup, setShowRepoPopup] = useState(false);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [creatingExperiment, setCreatingExperiment] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    fetchProject();
    fetchExperiments();
  }, []);

  useEffect(() => {
    if (!loading && !project) {
      navigate('/connect-github', { replace: true });
    }
  }, [loading, project, navigate]);

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

  const handleDisconnect = async () => {
    try {
      await api.delete('/api/github/project');
      setProject(null);
      setError(null);
      toast.success('Repository disconnected');
    } catch (err) {
      setError('Failed to disconnect repository');
      toast.error('Failed to disconnect');
    }
  };

  const handleSwitchRepository = async () => {
    try {
      await api.delete('/api/github/project');
      setProject(null);
      setError(null);
      toast.success('Select a new repository');
      navigate('/connect-github', { replace: true });
    } catch (err) {
      setError('Failed to switch repository');
      toast.error('Failed to switch repository');
    }
  };

  const handleCreateExperiment = async (formData: ExperimentFormData) => {
    try {
      const response = await api.post('/api/experiments', formData);
      // Set the creating experiment state to show progress
      setCreatingExperiment({
        id: response.data.id,
        name: response.data.name
      });
      setError(null);
    } catch (err: any) {
      setError('Failed to create experiment');
      console.error('Error creating experiment:', err);
    }
  };

  const handleExperimentComplete = async () => {
    // Refresh experiments list
    await fetchExperiments();
    // Clear the creating state
    setCreatingExperiment(null);
    // Optionally select the newly created experiment
    if (creatingExperiment) {
      const newExperiment = experiments.find(exp => exp.id === creatingExperiment.id);
      if (newExperiment) {
        setSelectedExperiment(newExperiment);
      }
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
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav
        user={user}
        project={project}
        showRepoPopup={showRepoPopup}
        onTogglePopup={() => setShowRepoPopup(!showRepoPopup)}
        onLogout={logout}
        onDisconnect={handleDisconnect}
        onSwitchRepository={handleSwitchRepository}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        <ExperimentsSidebar
          experiments={experiments}
          selectedExperiment={selectedExperiment}
          onSelectExperiment={(experiment: Experiment) => setSelectedExperiment(experiment)}
        />

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {creatingExperiment ? (
            <ExperimentProgress
              experimentId={creatingExperiment.id}
              experimentName={creatingExperiment.name}
              onComplete={handleExperimentComplete}
            />
          ) : selectedExperiment ? (
            <ExperimentDetails experiment={selectedExperiment} />
          ) : (
            <ExperimentForm onSubmit={handleCreateExperiment} />
          )}
        </div>
      </div>
    </div>
  );
};
