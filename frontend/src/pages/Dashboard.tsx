import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { projectCache } from '@/services/projectCache.service';
import { AppBackground } from '@/components/ui/app-background';
import { DashboardNav } from '@/components/DashboardNav';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentDetails } from '@/components/ExperimentDetails';
import { ExperimentProgress } from '@/components/ExperimentProgress';
import { ExperimentLivePreview } from '@/components/ExperimentLivePreview';
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
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showRepoPopup, setShowRepoPopup] = useState(false);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [creatingExperiment, setCreatingExperiment] = useState<{ id: number; name: string } | null>(null);
  const [experimentView, setExperimentView] = useState<'details' | 'live'>('details');

  const { data: project, isLoading: loading } = useQuery({
    queryKey: ['github-project'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/github/project');
        const data = res.data as Project;
        projectCache.set(data);
        return data;
      } catch (err: any) {
        if (err?.response?.status === 404) {
          projectCache.clear();
          return null;
        }
        throw err;
      }
    },
    initialData: projectCache.get() ?? undefined,
    retry: (failureCount, error: any) =>
      failureCount < 1 && error?.response?.status === 404 ? false : failureCount < 3,
  });

  useEffect(() => {
    api.get('/api/experiments').then((r) => setExperiments(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!loading && !project) {
      navigate('/connect-github', { replace: true });
    }
  }, [loading, project, navigate]);

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
      projectCache.clear();
      queryClient.setQueryData(['github-project'], null);
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
      projectCache.clear();
      queryClient.setQueryData(['github-project'], null);
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

  const handleExperimentComplete = async (createdId?: number) => {
    const idToSelect = createdId ?? creatingExperiment?.id;
    await fetchExperiments();
    setCreatingExperiment(null);
    if (idToSelect) {
      const updated = await api.get('/api/experiments').then((r) => r.data as Experiment[]);
      const newExp = updated.find((e) => e.id === idToSelect);
      if (newExp) setSelectedExperiment(newExp);
    }
  };

  if (!project && loading) {
    return (
      <AppBackground>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-1 w-32 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-1/3 bg-primary rounded-full animate-loading-bar" />
            </div>
            <p className="text-sm text-slate-500">Loading project...</p>
          </div>
        </div>
      </AppBackground>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <AppBackground className="flex flex-col">
      <DashboardNav
        user={user}
        project={project}
        experiments={experiments}
        selectedExperiment={selectedExperiment}
        experimentView={experimentView}
        showRepoPopup={showRepoPopup}
        onSelectExperiment={setSelectedExperiment}
        onExperimentViewChange={setExperimentView}
        onTogglePopup={() => setShowRepoPopup(!showRepoPopup)}
        onLogout={logout}
        onDisconnect={handleDisconnect}
        onSwitchRepository={handleSwitchRepository}
      />

      <div className="flex flex-1 min-h-0">
        <div
          className={cn(
            'flex-1 relative z-20 flex flex-col min-h-0',
            selectedExperiment && experimentView === 'live' ? 'overflow-hidden p-4' : 'overflow-y-auto p-6'
          )}
        >
          {error && (
            <div className="mb-4 glass-panel-vibe border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {creatingExperiment && (
            <ExperimentProgress
              experimentId={creatingExperiment.id}
              experimentName={creatingExperiment.name}
              onComplete={handleExperimentComplete}
            />
          )}
          {!creatingExperiment && selectedExperiment && (
            <div className="flex flex-col h-full min-h-0">
              {experimentView === 'details' ? (
                <ExperimentDetails experiment={selectedExperiment} />
              ) : (
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ExperimentLivePreview
                    experiment={selectedExperiment}
                    project={project}
                  />
                </div>
              )}
            </div>
          )}
          {!creatingExperiment && !selectedExperiment && (
            <ExperimentForm onSubmit={handleCreateExperiment} />
          )}
        </div>
      </div>
    </AppBackground>
  );
};
