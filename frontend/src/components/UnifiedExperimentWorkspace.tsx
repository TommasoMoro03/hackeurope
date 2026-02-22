import { GlassPanel } from '@/components/ui/glass-panel';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentDetailsCards } from '@/components/ExperimentDetailsCards';
import { ExperimentDataCard } from '@/components/ExperimentDataCard';
import { ExperimentProgressSteps } from '@/components/ExperimentProgressSteps';
import { SplitPreviewPanel } from '@/components/SplitPreviewPanel';
import type { ExperimentFormData } from '@/components/ExperimentForm';

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
  preview_url?: string;
  pr_url?: string;
  segment_preview_hashes?: Record<string, string>;  // { segment_id: hash }
  segments: Segment[];
  created_at: string;
}

interface Project {
  github_url: string;
}

type WorkspaceMode = 'planning' | 'loading' | 'experiment';

interface UnifiedExperimentWorkspaceProps {
  mode: WorkspaceMode;
  onCreateExperiment: (data: ExperimentFormData) => void;
  creatingExperiment?: { id: number; name: string } | null;
  onCreationComplete: (experimentId?: number) => void;
  selectedExperiment?: Experiment | null;
  onExperimentUpdate?: (updates: Partial<Experiment>) => void;
  onFinish?: () => void;
  project?: Project | null;
  percentageError?: string | null;
}

export const UnifiedExperimentWorkspace = ({
  mode,
  onCreateExperiment,
  creatingExperiment,
  onCreationComplete,
  selectedExperiment,
  onExperimentUpdate,
  onFinish,
  percentageError,
}: UnifiedExperimentWorkspaceProps) => {
  const renderLeftCards = () => {
    if (mode === 'planning') {
      return (
        <ExperimentForm
          onSubmit={onCreateExperiment}
          layout="default"
          percentageError={percentageError}
        />
      );
    }

    if (mode === 'loading' && creatingExperiment) {
      return (
        <>
          <GlassPanel title="Test Configuration" className="rounded-xl">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white">{creatingExperiment.name}</h3>
              <p className="text-xs text-slate-500 mt-1">Creating experiment...</p>
            </div>
          </GlassPanel>
          <GlassPanel title="Progress" className="rounded-xl flex-1 min-h-0 overflow-hidden">
            <ExperimentProgressSteps
              experimentId={creatingExperiment.id}
              experimentName={creatingExperiment.name}
              onComplete={onCreationComplete}
              compact
            />
          </GlassPanel>
        </>
      );
    }

    if (mode === 'experiment' && selectedExperiment) {
      return (
        <>
          <ExperimentDetailsCards
            experiment={selectedExperiment}
            onExperimentUpdate={onExperimentUpdate}
            onFinish={onFinish}
          />
          <ExperimentDataCard experimentId={selectedExperiment.id} />
        </>
      );
    }

    return null;
  };

  const renderRightPreview = () => {
    if (mode === 'loading') {
      return (
        <SplitPreviewPanel
          mode="loading"
          controlLabel="Original Baseline"
          variantLabel="AI Generated"
        />
      );
    }

    if (mode === 'experiment' && selectedExperiment) {
      const baseUrl = selectedExperiment.preview_url?.trim() || '';
      const hashes = selectedExperiment.segment_preview_hashes;
      const controlSeg = selectedExperiment.segments[0];
      const variantSeg = selectedExperiment.segments[1];
      const controlHash = controlSeg && hashes?.[String(controlSeg.id)];
      const variantHash = variantSeg && hashes?.[String(variantSeg.id)];
      const controlUrl = baseUrl
        ? controlHash
          ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}x=${controlHash}`
          : baseUrl
        : undefined;
      const variantUrl = baseUrl
        ? variantHash
          ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}x=${variantHash}`
          : baseUrl
        : undefined;
      const hasPreviewData = !!baseUrl;
      return (
        <SplitPreviewPanel
          mode={hasPreviewData ? 'live' : 'loading'}
          controlLabel={controlSeg?.name ?? 'Control'}
          variantLabel={variantSeg?.name ?? 'Variant B'}
          controlUrl={controlUrl}
          variantUrl={variantUrl}
          controlData={`${((controlSeg?.percentage ?? 0) * 100).toFixed(0)}% traffic`}
          variantData={`${((variantSeg?.percentage ?? 0) * 100).toFixed(0)}% traffic`}
        />
      );
    }

    return null;
  };

  const showSplitPreview = mode === 'loading' || (mode === 'experiment' && selectedExperiment);

  if (mode === 'planning') {
    return (
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {renderLeftCards()}
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-4 min-h-0 min-w-0">
      <aside className="w-[340px] shrink-0 flex flex-col gap-4 overflow-y-auto">
        {renderLeftCards()}
      </aside>

      {showSplitPreview && (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-[400px]">
          {renderRightPreview()}
        </main>
      )}
    </div>
  );
};
