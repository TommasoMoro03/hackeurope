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

interface ExperimentDetailsProps {
  experiment: Experiment;
}

export const ExperimentDetails = ({ experiment }: ExperimentDetailsProps) => {
  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{experiment.name}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              experiment.status === 'active' ? 'bg-green-100 text-green-800' :
              experiment.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {experiment.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Created {new Date(experiment.created_at).toLocaleDateString()}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
          <p className="text-gray-900">{experiment.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">User Coverage</h3>
            <p className="text-2xl font-bold text-gray-900">{experiment.percentage}%</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Segments</h3>
            <p className="text-2xl font-bold text-gray-900">{experiment.segments.length}</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Metrics</h3>
          <p className="text-gray-900 whitespace-pre-wrap">{experiment.metrics}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Segments</h3>
          <div className="space-y-4">
            {experiment.segments.map((segment, index) => (
              <div key={segment.id} className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{segment.name}</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{segment.instructions}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
