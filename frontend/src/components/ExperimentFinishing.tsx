import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';

interface ExperimentFinishingProps {
  experimentId: number;
  experimentName: string;
  onComplete: () => void;
}

interface FinishingStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

export const ExperimentFinishing = ({ experimentId, experimentName, onComplete }: ExperimentFinishingProps) => {
  const [status, setStatus] = useState<string>('finishing');
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<FinishingStep[]>([
    { id: 'collect', label: 'Collecting experiment data', status: 'pending' },
    { id: 'analyze', label: 'Analyzing results', status: 'pending' },
    { id: 'generate', label: 'Generating final report', status: 'pending' },
    { id: 'finalize', label: 'Finalizing experiment', status: 'pending' },
  ]);

  useEffect(() => {
    let startTime = Date.now();

    // Simulate progress steps with timeouts
    const updateSteps = () => {
      const elapsed = Date.now() - startTime;

      // Step 1: Collecting (0-3s)
      if (elapsed >= 0) {
        setSteps(prev => prev.map(step =>
          step.id === 'collect' ? { ...step, status: 'loading' as const } : step
        ));
      }

      // Step 1 complete, Step 2 starts (3-6s)
      if (elapsed >= 3000) {
        setSteps(prev => prev.map(step =>
          step.id === 'collect' ? { ...step, status: 'completed' as const } :
          step.id === 'analyze' ? { ...step, status: 'loading' as const } : step
        ));
      }

      // Step 2 complete, Step 3 starts (6-9s)
      if (elapsed >= 6000) {
        setSteps(prev => prev.map(step =>
          step.id === 'analyze' ? { ...step, status: 'completed' as const } :
          step.id === 'generate' ? { ...step, status: 'loading' as const } : step
        ));
      }

      // Step 3 complete, Step 4 starts (9-12s)
      if (elapsed >= 9000) {
        setSteps(prev => prev.map(step =>
          step.id === 'generate' ? { ...step, status: 'completed' as const } :
          step.id === 'finalize' ? { ...step, status: 'loading' as const } : step
        ));
      }
    };

    const stepInterval = setInterval(updateSteps, 500);

    // Poll the actual status every 2 seconds
    const pollStatus = async () => {
      try {
        const response = await api.get(`/api/experiments/${experimentId}/status`);
        const newStatus = response.data.status;
        setStatus(newStatus);

        // If status is finished or failed, complete all steps and stop polling
        if (newStatus === 'finished' || newStatus === 'failed') {
          if (newStatus === 'finished') {
            setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));
          }
          clearInterval(interval);
          clearInterval(stepInterval);
          setTimeout(() => onComplete(), 1000);
        }
      } catch (err: any) {
        setError('Failed to fetch experiment status');
        console.error('Error polling status:', err);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [experimentId, onComplete]);

  const renderStepIcon = (stepStatus: 'pending' | 'loading' | 'completed') => {
    if (stepStatus === 'completed') {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }

    if (stepStatus === 'loading') {
      return (
        <svg className="animate-spin w-5 h-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }

    return (
      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {status === 'finished' ? 'Experiment Finished!' : status === 'failed' ? 'Error' : 'Finishing Experiment'}
          </h3>
          <p className="text-gray-600">
            {status === 'finished'
              ? `"${experimentName}" has been successfully finished`
              : status === 'failed'
              ? 'There was an error finishing your experiment'
              : 'Please wait while we finalize your experiment'}
          </p>
        </div>

        {/* Progress Steps */}
        {status === 'finishing' && (
          <div className="space-y-3 mb-6">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {renderStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'loading' ? 'text-blue-700' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success Icon */}
        {status === 'finished' && (
          <div className="flex justify-center mb-6">
            <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Error Icon */}
        {status === 'failed' && (
          <div className="flex justify-center mb-6">
            <svg className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="text-center text-sm text-gray-500 mt-4">
          This may take a few moments
        </div>
      </div>
    </div>
  );
};
