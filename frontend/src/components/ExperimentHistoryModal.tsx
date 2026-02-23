import { useMemo } from 'react';
import { X, Award } from 'lucide-react';
import Xarrow from 'react-xarrows';
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
    const winningSegment = exp.segments?.find(seg => seg.id === exp.winning_segment_id);

    console.log('Experiment:', exp.id, 'Winner ID:', exp.winning_segment_id, 'Found Winner:', winningSegment?.name);

    return (
      <div key={exp.id} className="flex flex-col items-center">
        {/* Experiment Title */}
        <div className="flex flex-col items-center mb-6">
          <div
            id={`exp-${exp.id}`}
            className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md"
          >
            <span className="text-white text-[9px] font-bold">
              {exp.id}
            </span>
          </div>
          <div className="mt-1 text-center max-w-[180px]">
            <p className="text-[11px] font-semibold text-gray-900 truncate">{exp.name}</p>
            <p className="text-[9px] text-gray-500">
              {exp.status === 'finished' ? 'Finished' : exp.status}
            </p>
          </div>
        </div>

        {/* Segments */}
        <div className="flex gap-3 mb-6">
          {exp.segments?.map((segment: Segment) => {
            const isWinner = segment.id === exp.winning_segment_id;

            return (
              <div key={segment.id} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-all ${
                    isWinner
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 ring-2 ring-yellow-300'
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}
                >
                  {isWinner && <Award className="w-3 h-3 text-white" />}
                </div>
                <p
                  id={`seg-${segment.id}`}
                  className={`text-[9px] mt-1 font-medium ${
                    isWinner ? 'text-yellow-700' : 'text-gray-600'
                  }`}
                >
                  {segment.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
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
              <h2 className="text-xl font-bold text-gray-900">Experiment Iteration Tree</h2>
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
        <div className="flex-1 overflow-y-auto p-8">
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
            <div className="space-y-2">
              {/* Legend */}
              <div className="mb-6 flex items-center justify-center gap-3 text-[10px] bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-2.5">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                  <span className="text-gray-700 font-medium">Experiment</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-600"></div>
                  <span className="text-gray-700 font-medium">Segment</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">Winner</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" viewBox="0 0 16 16">
                    <path d="M 8 2 L 8 14 M 5 11 L 8 14 L 11 11" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-gray-700 font-medium">Path</span>
                </div>
              </div>

              {/* Experiment Tree */}
              <div className="flex flex-col items-center relative">
                {recentExperiments.map((exp, idx) => renderExperimentNode(exp, idx))}

                {/* Arrows connecting winners to next experiments */}
                {recentExperiments.map((exp, idx) => {
                  const winningSegment = exp.segments?.find(seg => seg.id === exp.winning_segment_id);
                  const nextExp = recentExperiments[idx + 1];

                  if (!winningSegment || !nextExp) return null;

                  return (
                    <Xarrow
                      key={`arrow-${exp.id}`}
                      start={`seg-${winningSegment.id}`}
                      end={`exp-${nextExp.id}`}
                      color="#3b82f6"
                      strokeWidth={1.5}
                      headSize={4}
                      curveness={0.3}
                      showHead={true}
                    />
                  );
                })}
              </div>

              {experiments.length > 5 && (
                <div className="mt-8 text-center text-sm text-gray-500 bg-gray-50 rounded-lg py-3">
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
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
