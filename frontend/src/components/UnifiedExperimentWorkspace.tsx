import { GlassPanel } from '@/components/ui/glass-panel';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentDetailsCards } from '@/components/ExperimentDetailsCards';
import { ExperimentDataCard } from '@/components/ExperimentDataCard';
import { ExperimentProgressSteps } from '@/components/ExperimentProgressSteps';
import { ExperimentPRFlowCards } from '@/components/ExperimentPRFlowCards';
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
  onPRMerged?: () => void;
  project?: Project | null;
  percentageError?: string | null;
}

const PR_STATUSES = ['started', 'implementing', 'pr_created'];

export const UnifiedExperimentWorkspace = ({
  mode,
  onCreateExperiment,
  creatingExperiment,
  onCreationComplete,
  selectedExperiment,
  onExperimentUpdate,
  onFinish,
  onPRMerged,
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
          <GlassPanel title="Test Configuration" className="rounded-lg">
            <div className="p-3">
              <h3 className="text-sm font-semibold text-white truncate">{creatingExperiment.name}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Creating experiment...</p>
            </div>
          </GlassPanel>
          <GlassPanel title="Progress" className="rounded-lg flex-1 min-h-0 overflow-hidden">
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
      const isPRFlow = PR_STATUSES.includes(selectedExperiment.status);
      return (
        <>
          <ExperimentDetailsCards
            experiment={selectedExperiment}
            onExperimentUpdate={onExperimentUpdate}
            onFinish={onFinish}
          />
          {isPRFlow && onPRMerged && (
            <ExperimentPRFlowCards
              experiment={selectedExperiment}
              onMerged={onPRMerged}
              onExperimentUpdate={onExperimentUpdate}
            />
          )}
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
          controlLabel="A"
          variantLabel="B"
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
    <div className="flex flex-1 gap-3 min-h-0 min-w-0">
      <aside className="w-[280px] shrink-0 flex flex-col gap-3 overflow-y-auto scrollbar-hide">
        {renderLeftCards()}
      </aside>

      {showSplitPreview && (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-[320px]">
          {renderRightPreview()}
        </main>
      )}
    </div>
  );
};
