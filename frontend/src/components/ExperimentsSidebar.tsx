import { cn } from '@/lib/utils';
import { FlaskConical } from 'lucide-react';
import type { Experiment } from '@/types/experiment';

interface ExperimentsSidebarProps {
  experiments: Experiment[];
  selectedExperiment: Experiment | null;
  onSelectExperiment: (experiment: Experiment) => void;
}

export const ExperimentsSidebar = ({ experiments, selectedExperiment, onSelectExperiment }: ExperimentsSidebarProps) => {
  return (
    <div className="w-56 md:w-64 shrink-0 border-r border-white/5 bg-black/20 overflow-y-auto scrollbar-hide">
      <div className="p-4">
        <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">
          <FlaskConical className="w-4 h-4" />
          Experiments
        </h2>
        {experiments.length === 0 ? (
          <p className="text-sm text-slate-600">No experiments yet</p>
        ) : (
          <div className="space-y-2">
            {experiments.map((exp) => (
              <button
                key={exp.id}
                onClick={() => onSelectExperiment(exp)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all duration-200',
                  selectedExperiment?.id === exp.id
                    ? 'border-primary/50 bg-primary/10 text-white'
                    : 'border-white/5 bg-white/5 hover:border-white/10 hover:bg-white/[0.07] text-slate-300 hover:text-white'
                )}
              >
                <div className="font-medium text-sm truncate">{exp.name}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider mt-1 opacity-70">
                  {exp.status}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
