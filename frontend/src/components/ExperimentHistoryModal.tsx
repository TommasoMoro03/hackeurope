import { useMemo } from 'react';
import { X, Award } from 'lucide-react';
import type { Experiment, Segment } from '@/types/experiment';

interface ExperimentHistoryModalProps {
  experiments: Experiment[];
  onClose: () => void;
}

export const ExperimentHistoryModal = ({ experiments, onClose }: ExperimentHistoryModalProps) => {
  // Take only the last 5 experiments, sorted by created_at (oldest to newest for tree building)
  const recentExperiments = useMemo(() => {
    return [...experiments]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-5);
  }, [experiments]);

  const renderExperimentNode = (exp: Experiment, index: number) => {
    const isLast = index === recentExperiments.length - 1;
    const nextExp = !isLast ? recentExperiments[index + 1] : null;

    return (
      <div key={exp.id} className="flex flex-col gap-2">
        {/* Experiment Circle */}
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20"></div>
          <div className="text-sm font-semibold text-gray-900">{exp.name}</div>
        </div>

        {/* Segments */}
        {exp.segments && exp.segments.length > 0 && (
          <div className="ml-6 pl-4 border-l-2 border-gray-200 space-y-2 pb-2">
            {exp.segments.map((segment: Segment) => {
              const isWinner = segment.id === exp.winning_segment_id;

              return (
                <div key={segment.id} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5"></div>
                  <div className={`flex-1 text-xs px-2 py-1 rounded ${
                    isWinner
                      ? 'bg-green-100 border border-green-300 font-semibold text-green-900'
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    <div className="flex items-center gap-1">
                      {segment.name}
                      {isWinner && <Award className="w-3 h-3 text-green-600" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Connector to next experiment */}
        {nextExp && (
          <div className="ml-6 pl-4 border-l-2 border-blue-300">
            <div className="h-4"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Experiment History</h2>
              <p className="text-sm text-gray-500">Last {Math.min(experiments.length, 5)} experiments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {recentExperiments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Experiment History</h3>
              <p className="text-sm text-gray-600">Create your first experiment to start tracking iterations</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="mb-4 flex items-center gap-4 text-xs bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700">Experiment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span className="text-gray-700">Segment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-gray-700">Winner</span>
                </div>
              </div>

              {recentExperiments.map((exp, idx) => renderExperimentNode(exp, idx))}

              {experiments.length > 5 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                  Showing most recent 5 of {experiments.length} total experiments
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
