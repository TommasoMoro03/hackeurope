import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { GlassPanel } from '@/components/ui/glass-panel';
import { ExperimentForm } from '@/components/ExperimentForm';
import { ExperimentDetailsCards } from '@/components/ExperimentDetailsCards';
import { ExperimentDataCard } from '@/components/ExperimentDataCard';
import { ExperimentProgressSteps } from '@/components/ExperimentProgressSteps';
import { SplitPreviewPanel } from '@/components/SplitPreviewPanel';
import { CreationCompletePanel } from '@/components/CreationCompletePanel';
import { ExperimentFinishing } from '@/components/ExperimentFinishing';
import { ExperimentResultsPanel } from '@/components/ExperimentResultsPanel';
import { ExperimentIterating } from '@/components/ExperimentIterating';
import { ExperimentIterationSuggestion } from '@/components/ExperimentIterationSuggestion';
import type { ExperimentFormData } from '@/components/ExperimentForm';
import type { Experiment } from '@/types/experiment';

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
  onIterate?: () => void;
  onPRMerged?: (experimentId?: number) => void;
  project?: Project | null;
  percentageError?: string | null;
  isFinishing?: boolean;
  finishingExperiment?: { id: number; name: string } | null;
  onFinishingComplete?: () => void;
  iteratingExperiment?: { id: number; name: string } | null;
  iterationSuggestion?: any;
  onIterationComplete?: () => void;
  onAcceptIteration?: (formData: ExperimentFormData) => void;
  onRejectIteration?: () => void;
}

const PR_STATUSES = ['started', 'implementing', 'pr_created'];

interface CreationStatusSegment {
  id: number;
  name: string;
  instructions: string;
  percentage: number;
}

interface CreationStatus {
  status: string;
  pr_url?: string | null;
  preview_url?: string | null;
  segment_preview_hashes?: Record<string, string>;
  segment_preview_urls?: Record<string, string>;
  description?: string;
  metrics?: string;
  percentage?: number;
  segments?: CreationStatusSegment[];
}

export const UnifiedExperimentWorkspace = ({
  mode,
  onCreateExperiment,
  creatingExperiment,
  onCreationComplete,
  selectedExperiment,
  onExperimentUpdate,
  onFinish,
  onIterate,
  onPRMerged,
  percentageError,
  isFinishing = false,
  finishingExperiment,
  onFinishingComplete,
  iteratingExperiment,
  iterationSuggestion,
  onIterationComplete,
  onAcceptIteration,
  onRejectIteration,
}: UnifiedExperimentWorkspaceProps) => {
  const [creationStatus, setCreationStatus] = useState<CreationStatus | null>(null);

  useEffect(() => {
    if (!creatingExperiment || mode !== 'loading') {
      setCreationStatus(null);
      return;
    }
    const poll = async () => {
      try {
        const res = await api.get(`/api/experiments/${creatingExperiment.id}/status`);
        setCreationStatus({
          status: res.data.status,
          pr_url: res.data.pr_url,
          preview_url: res.data.preview_url,
          segment_preview_hashes: res.data.segment_preview_hashes,
          segment_preview_urls: res.data.segment_preview_urls,
          description: res.data.description,
          metrics: res.data.metrics,
          percentage: res.data.percentage,
          segments: res.data.segments,
        });
      } catch {
        // ignore
      }
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [creatingExperiment?.id, mode]);

  const isCreationComplete = creationStatus && (creationStatus.status === 'pr_created' || creationStatus.status === 'active');

  const renderLeftCards = () => {
    if (iteratingExperiment && onIterationComplete) {
      return (
        <ExperimentIterating
          experimentId={iteratingExperiment.id}
          experimentName={iteratingExperiment.name}
          onComplete={onIterationComplete}
          inline
        />
      );
    }

    if (finishingExperiment && onFinishingComplete) {
      return (
        <ExperimentFinishing
          experimentId={finishingExperiment.id}
          experimentName={finishingExperiment.name}
          onComplete={onFinishingComplete}
          inline
        />
      );
    }

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
      if (isCreationComplete) {
        const handleUpdate = (updates: { preview_url?: string }) => {
          if (updates.preview_url !== undefined && creationStatus) {
            setCreationStatus((prev) => prev && { ...prev, preview_url: updates.preview_url ?? null });
          }
          onExperimentUpdate?.(updates);
        };
        return (
          <GlassPanel title="PR Created" className="rounded-lg flex-1 min-h-0 overflow-y-auto scrollbar-hide">
            <CreationCompletePanel
              experimentId={creatingExperiment.id}
              experimentName={creatingExperiment.name}
              prUrl={creationStatus?.pr_url}
              initialPreviewUrl={creationStatus?.preview_url}
              segments={creationStatus?.segments}
              onComplete={onCreationComplete}
              onExperimentUpdate={handleUpdate}
              onMerged={onPRMerged ? () => onPRMerged(creatingExperiment.id) : undefined}
            />
          </GlassPanel>
        );
      }
      return (
        <>
          <GlassPanel title="Progress" className="rounded-lg flex-1 min-h-0 overflow-hidden">
            <ExperimentProgressSteps
              experimentId={creatingExperiment.id}
              experimentName={creatingExperiment.name}
              onComplete={onCreationComplete}
              onExperimentUpdate={onExperimentUpdate}
              compact
            />
          </GlassPanel>
          <GlassPanel title="Test Configuration" className="rounded-lg shrink-0">
            <div className="p-3">
              <h3 className="text-sm font-semibold text-white truncate">{creatingExperiment.name}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Creating experiment...</p>
            </div>
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
            onIterate={onIterate}
            isFinishing={isFinishing}
          />
          <ExperimentDataCard experimentId={selectedExperiment.id} />
          {isPRFlow && onPRMerged && (
            <GlassPanel title="PR Ready" className="rounded-lg shrink-0">
              <CreationCompletePanel
                experimentId={selectedExperiment.id}
                experimentName={selectedExperiment.name}
                prUrl={selectedExperiment.pr_url}
                initialPreviewUrl={selectedExperiment.preview_url}
                segments={selectedExperiment.segments}
                onComplete={() => {}}
                onExperimentUpdate={onExperimentUpdate}
                onMerged={() => onPRMerged?.(selectedExperiment.id)}
                compact
              />
            </GlassPanel>
          )}
        </>
      );
    }

    return null;
  };

  const renderRightPreview = () => {
    // Show iteration suggestion or loading when iterating
    if (iteratingExperiment && iterationSuggestion && onAcceptIteration && onRejectIteration) {
      return (
        <ExperimentIterationSuggestion
          suggestion={iterationSuggestion}
          basedOnExperimentName={iteratingExperiment.name}
          onAccept={onAcceptIteration}
          onReject={onRejectIteration}
        />
      );
    }

    if (iteratingExperiment) {
      return (
        <GlassPanel className="rounded-lg flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="size-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-slate-400">Generating iteration...</p>
          </div>
        </GlassPanel>
      );
    }

    // Show results panel when finishing or finished
    if (finishingExperiment) {
      return (
        <ExperimentResultsPanel
          experimentId={finishingExperiment.id}
          isLoading={true}
        />
      );
    }

    if (selectedExperiment?.status === 'finished') {
      return (
        <ExperimentResultsPanel
          experimentId={selectedExperiment.id}
          isLoading={false}
        />
      );
    }

    if (mode === 'loading' && creatingExperiment) {
      const cSeg = creationStatus?.segments?.[0];
      const vSeg = creationStatus?.segments?.[1];
      const base = (creationStatus?.preview_url ?? '').trim();
      const controlUrl = base ? `${base.replace(/#.*$/, '')}#test1` : undefined;
      const variantUrl = base ? `${base.replace(/#.*$/, '')}#test2` : undefined;
      const hasPreviewData = !!base;
      const handlePreviewUrlSave = async (url: string) => {
        await api.patch(`/api/experiments/${creatingExperiment.id}/preview-url`, {
          preview_url: url.trim() || null,
        });
        setCreationStatus((prev) => prev && { ...prev, preview_url: url.trim() || null });
        onExperimentUpdate?.({ preview_url: url.trim() || undefined });
      };
      return (
        <SplitPreviewPanel
          mode={hasPreviewData ? 'live' : 'loading'}
          controlLabel={cSeg?.name ?? 'A'}
          variantLabel={vSeg?.name ?? 'B'}
          controlUrl={controlUrl}
          variantUrl={variantUrl}
          controlData={cSeg ? `${((cSeg.percentage ?? 0) * 100).toFixed(0)}% traffic` : undefined}
          variantData={vSeg ? `${((vSeg.percentage ?? 0) * 100).toFixed(0)}% traffic` : undefined}
          controlInstructions={cSeg?.instructions}
          variantInstructions={vSeg?.instructions}
          controlPercentage={cSeg?.percentage}
          variantPercentage={vSeg?.percentage}
          metrics={creationStatus?.metrics}
          description={creationStatus?.description}
          previewUrlBase={creationStatus?.preview_url ?? ''}
          onPreviewUrlSave={handlePreviewUrlSave}
        />
      );
    }

    if (mode === 'experiment' && selectedExperiment) {
      const base = (selectedExperiment.preview_url ?? '').trim();
      const controlSeg = selectedExperiment.segments[0];
      const variantSeg = selectedExperiment.segments[1];
      const controlUrl = base ? `${base.replace(/#.*$/, '')}#test1` : undefined;
      const variantUrl = base ? `${base.replace(/#.*$/, '')}#test2` : undefined;
      const hasPreviewData = !!base;
      const handlePreviewUrlSave = async (url: string) => {
        await api.patch(`/api/experiments/${selectedExperiment!.id}/preview-url`, {
          preview_url: url.trim() || null,
        });
        onExperimentUpdate?.({ preview_url: url.trim() || undefined });
      };
      return (
        <>
          <SplitPreviewPanel
            mode={hasPreviewData ? 'live' : 'loading'}
            controlLabel={controlSeg?.name ?? 'Control'}
            variantLabel={variantSeg?.name ?? 'Variant B'}
            controlUrl={controlUrl}
            variantUrl={variantUrl}
            controlData={`${((controlSeg?.percentage ?? 0) * 100).toFixed(0)}% traffic`}
            variantData={`${((variantSeg?.percentage ?? 0) * 100).toFixed(0)}% traffic`}
            controlInstructions={controlSeg?.instructions}
            variantInstructions={variantSeg?.instructions}
            controlPercentage={controlSeg?.percentage}
            variantPercentage={variantSeg?.percentage}
            metrics={selectedExperiment.metrics}
            description={selectedExperiment.description}
            previewUrlBase={selectedExperiment.preview_url ?? ''}
            onPreviewUrlSave={handlePreviewUrlSave}
          />
        </>
      );
    }

    return null;
  };

  const showSplitPreview = mode === 'loading' || (mode === 'experiment' && selectedExperiment) || finishingExperiment || selectedExperiment?.status === 'finished' || iteratingExperiment;

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
        <main className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto scrollbar-hide min-h-[320px]">
          {renderRightPreview()}
        </main>
      )}
    </div>
  );
};
