import { useState, useEffect } from 'react';
import { ExperimentDetails } from './ExperimentDetails';
import { ExperimentData } from './ExperimentData';
import { ExperimentPreview } from './ExperimentPreview';
import { ExperimentResults } from './ExperimentResults';
import { ExperimentIteration } from './ExperimentIteration';
import type { Experiment } from '@/types/experiment';

interface ExperimentTabsProps {
  experiment: Experiment;
  onFinish: () => void;
  onExperimentUpdate?: (updates: Partial<Experiment>) => void;
  onAcceptIterationSuggestion?: (data: any) => void;
}

type TabType = 'details' | 'data' | 'preview' | 'results';

export const ExperimentTabs = ({ experiment, onFinish, onExperimentUpdate, onAcceptIterationSuggestion }: ExperimentTabsProps) => {
  // Default to results tab if experiment is finished, otherwise details
  const defaultTab: TabType = experiment.status === 'finished' ? 'results' : 'details';
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [showIterationModal, setShowIterationModal] = useState(false);

  // Auto-switch to results tab when experiment becomes finished
  useEffect(() => {
    if (experiment.status === 'finished' && activeTab !== 'results') {
      setActiveTab('results');
    }
  }, [experiment.status]);

  const tabs = [
    { id: 'details' as TabType, label: 'Details' },
    { id: 'data' as TabType, label: 'Raw Data' },
    { id: 'preview' as TabType, label: 'Preview' },
    ...(experiment.status === 'finished' ? [{ id: 'results' as TabType, label: 'Results' }] : []),
  ];

  return (
    <div className="w-full max-w-7xl">
      {/* Header with optional Action Button */}
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
          <button
            onClick={() => setShowIterationModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Iterate
          </button>
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
          {activeTab === 'results' && experiment.status === 'finished' && (
            <ExperimentResults
              experimentId={experiment.id}
              experimentName={experiment.name}
            />
          )}
        </div>
      </div>

      {/* Iteration Modal */}
      {showIterationModal && (
        <ExperimentIteration
          experimentId={experiment.id}
          experimentName={experiment.name}
          onClose={() => setShowIterationModal(false)}
          onAcceptSuggestion={onAcceptIterationSuggestion}
        />
      )}
    </div>
  );
};
