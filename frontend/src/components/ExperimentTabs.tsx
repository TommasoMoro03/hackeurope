import { useState } from 'react';
import { ExperimentDetails } from './ExperimentDetails';
import { ExperimentData } from './ExperimentData';
import { ExperimentPreview } from './ExperimentPreview';

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
  segments: Segment[];
  created_at: string;
}

interface ExperimentTabsProps {
  experiment: Experiment;
  onFinish: () => void;
  onExperimentUpdate?: (updates: Partial<Experiment>) => void;
}

type TabType = 'details' | 'data' | 'preview';

export const ExperimentTabs = ({ experiment, onFinish, onExperimentUpdate }: ExperimentTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');

  const tabs = [
    { id: 'details' as TabType, label: 'Details' },
    { id: 'data' as TabType, label: 'Raw Data' },
    { id: 'preview' as TabType, label: 'Preview' },
  ];

  return (
    <div className="w-full max-w-7xl">
      {/* Header with optional Finish Button */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{experiment.name}</h1>
        {experiment.status === 'active' && (
          <button
            onClick={onFinish}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Finish Experiment
          </button>
        )}
        {experiment.status === 'finished' && (
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
            Experiment Finished
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <ExperimentDetails
              experiment={experiment}
              onExperimentUpdate={onExperimentUpdate}
            />
          )}
          {activeTab === 'data' && <ExperimentData experimentId={experiment.id} />}
          {activeTab === 'preview' && (
            <ExperimentPreview
              experimentId={experiment.id}
              experimentName={experiment.name}
              segments={experiment.segments}
              projectUrl={experiment.preview_url}
            />
          )}
        </div>
      </div>
    </div>
  );
};
