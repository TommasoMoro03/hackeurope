interface Experiment {
  id: number;
  name: string;
  status: string;
  description: string;
  percentage: number;
  metrics: string;
}

interface ExperimentsSidebarProps {
  experiments: Experiment[];
  selectedExperiment: Experiment | null;
  onSelectExperiment: (experiment: Experiment) => void;
}

export const ExperimentsSidebar = ({ experiments, selectedExperiment, onSelectExperiment }: ExperimentsSidebarProps) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Experiments</h2>
        {experiments.length === 0 ? (
          <p className="text-sm text-gray-500">No experiments yet</p>
        ) : (
          <div className="space-y-2">
            {experiments.map((exp) => (
              <div
                key={exp.id}
                onClick={() => onSelectExperiment(exp)}
                className={`p-3 rounded cursor-pointer transition-colors ${
                  selectedExperiment?.id === exp.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900">{exp.name}</div>
                <div className="text-xs text-gray-500">{exp.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
