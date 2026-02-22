import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';

interface Segment {
  name: string;
  instructions: string;
  percentage: number;
  reasoning: string;
}

interface ExperimentSuggestion {
  name: string;
  description: string;
  metrics: string;
  hypothesis: string;
}

interface IterationData {
  rational: string;
  experiment: ExperimentSuggestion;
  segments: Segment[];
  iteration_strategy: string;
}

interface IterationResponse {
  success: boolean;
  suggestion: IterationData;
  based_on_experiment_id: number;
  based_on_experiment_name: string;
}

interface ExperimentIterationProps {
  experimentId: number;
  experimentName: string;
  onClose: () => void;
  onAcceptSuggestion?: (data: any) => void;
}

export const ExperimentIteration = ({
  experimentId,
  experimentName,
  onClose,
  onAcceptSuggestion
}: ExperimentIterationProps) => {
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<IterationData | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  useEffect(() => {
    fetchIteration();
  }, [experimentId]);

  const fetchIteration = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/api/experiments/${experimentId}/iterate`);
      setSuggestion(response.data.suggestion);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate iteration');
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    fetchIteration();
  };

  const handleAccept = () => {
    if (!suggestion) return;

    // Transform suggestion into experiment form data format
    const experimentData = {
      name: suggestion.experiment.name,
      description: suggestion.experiment.description,
      metrics: suggestion.experiment.metrics,
      percentage: 1.0, // 100% traffic
      numSegments: suggestion.segments.length,
      preview_url: '',
      segments: suggestion.segments.map(seg => ({
        name: seg.name,
        instructions: seg.instructions,
        percentage: seg.percentage
      }))
    };

    if (onAcceptSuggestion) {
      onAcceptSuggestion(experimentData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Iterate Experiment</h2>
              <p className="text-sm text-gray-500">Based on: {experimentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {(loading || regenerating) && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                <svg className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-gray-700 font-medium">
                  {regenerating ? 'Regenerating suggestion...' : 'Analyzing results...'}
                </p>
                <p className="text-sm text-gray-500">
                  {regenerating ? 'Creating a new experiment proposal' : 'Generating next experiment suggestion'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {!loading && !regenerating && !error && suggestion && (
            <div className="space-y-6">
              {/* Rational */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 rounded-full p-2 flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Why This Experiment?</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{suggestion.rational}</p>
                  </div>
                </div>
              </div>

              {/* Experiment Plan */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Experiment Plan</h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</label>
                    <p className="text-gray-900 font-medium mt-1">{suggestion.experiment.name}</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                    <p className="text-gray-700 text-sm mt-1">{suggestion.experiment.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Metrics</label>
                      <p className="text-gray-700 text-sm mt-1">{suggestion.experiment.metrics}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Strategy</label>
                      <p className="text-gray-700 text-sm mt-1">{suggestion.iteration_strategy}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hypothesis</label>
                    <p className="text-gray-700 text-sm mt-1 italic">"{suggestion.experiment.hypothesis}"</p>
                  </div>
                </div>
              </div>

              {/* Segments */}
              <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Segments ({suggestion.segments.length})</h3>

                <div className="space-y-3">
                  {suggestion.segments.map((segment, index) => (
                    <div
                      key={index}
                      className="relative border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all bg-gray-50"
                      onMouseEnter={() => setHoveredSegment(index)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{segment.name}</h4>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {(segment.percentage * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{segment.instructions}</p>
                        </div>

                        {/* Info icon */}
                        <div className="relative ml-2">
                          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>

                      {/* Tooltip */}
                      {hoveredSegment === index && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <p className="text-xs text-blue-900 italic leading-relaxed">{segment.reasoning}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAccept}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept & Fill Form
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
