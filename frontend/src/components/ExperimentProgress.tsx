import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';

interface ExperimentProgressProps {
  experimentId: number;
  experimentName: string;
  onComplete: () => void;
}

interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed';
}

export const ExperimentProgress = ({ experimentId, experimentName, onComplete }: ExperimentProgressProps) => {
  const [status, setStatus] = useState<string>('started');
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<ProgressStep[]>([
    { id: 'analyze', label: 'Analyzing experiment requirements', status: 'pending' },
    { id: 'events', label: 'Extracting tracking events', status: 'pending' },
    { id: 'code', label: 'Generating implementation code', status: 'pending' },
    { id: 'pr', label: 'Creating pull request', status: 'pending' },
  ]);

  useEffect(() => {
    let startTime = Date.now();

    // Simulate progress steps with timeouts
    const updateSteps = () => {
      const elapsed = Date.now() - startTime;

      // Step 1: Analyzing (0-2s)
      if (elapsed >= 0) {
        setSteps(prev => prev.map(step =>
          step.id === 'analyze' ? { ...step, status: 'loading' as const } : step
        ));
      }

      // Step 1 complete, Step 2 starts (2-5s)
      if (elapsed >= 2000) {
        setSteps(prev => prev.map(step =>
          step.id === 'analyze' ? { ...step, status: 'completed' as const } :
          step.id === 'events' ? { ...step, status: 'loading' as const } : step
        ));
      }

      // Step 2 complete, Step 3 starts (5-10s)
      if (elapsed >= 5000) {
        setSteps(prev => prev.map(step =>
          step.id === 'events' ? { ...step, status: 'completed' as const } :
          step.id === 'code' ? { ...step, status: 'loading' as const } : step
        ));
      }

      // Step 3 complete, Step 4 starts (10s+)
      if (elapsed >= 10000) {
        setSteps(prev => prev.map(step =>
          step.id === 'code' ? { ...step, status: 'completed' as const } :
          step.id === 'pr' ? { ...step, status: 'loading' as const } : step
        ));
      }
    };

    // Update steps every 500ms
    const stepInterval = setInterval(updateSteps, 500);

    // Poll the actual status every 2 seconds
    const pollStatus = async () => {
      try {
        const response = await api.get(`/api/experiments/${experimentId}/status`);
        const newStatus = response.data.status;
        setStatus(newStatus);

        // If status is active or failed, complete all steps and stop polling
        if (newStatus === 'active' || newStatus === 'failed') {
          if (newStatus === 'active') {
            setSteps(prev => prev.map(step => ({ ...step, status: 'completed' as const })));
          }
          clearInterval(interval);
          clearInterval(stepInterval);
          setTimeout(() => onComplete(), 1000); // Small delay to show completion
        }
      } catch (err: any) {
        setError('Failed to fetch experiment status');
        console.error('Error polling status:', err);
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    const interval = setInterval(pollStatus, 2000); // Poll every 2 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [experimentId, onComplete]);

  const getStatusMessage = () => {
    switch (status) {
      case 'started':
        return 'Initializing experiment...';
      case 'implementing':
        return 'Implementing experiment changes...';
      case 'active':
        return 'Experiment is now active!';
      case 'failed':
        return 'Failed to implement experiment';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = () => {
    if (status === 'failed') {
      return (
        <svg className="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }

    if (status === 'active') {
      return (
        <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }

    // Animated spinner for in-progress states
    return (
      <svg className="animate-spin h-16 w-16 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );
  };

  const renderStepIcon = (stepStatus: 'pending' | 'loading' | 'completed') => {
    if (stepStatus === 'completed') {
      return (
        <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }

    if (stepStatus === 'loading') {
      return (
        <svg className="animate-spin w-6 h-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }

    return (
      <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
    );
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'active' ? 'Success!' : status === 'failed' ? 'Error' : 'Implementing Experiment'}
          </h2>
          <p className="text-gray-600">
            {status === 'active'
              ? `Your experiment "${experimentName}" is now ready!`
              : status === 'failed'
              ? 'There was an error implementing your experiment'
              : 'Please wait while we set up your experiment'}
          </p>
        </div>

        {/* Progress Steps */}
        {(status === 'started' || status === 'implementing') && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {renderStepIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'loading' ? 'text-blue-700' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {step.status === 'loading' && (
                      <p className="text-sm text-gray-500 mt-1">In progress...</p>
                    )}
                    {step.status === 'completed' && (
                      <p className="text-sm text-green-600 mt-1">Completed</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              This operation may take a couple of minutes
            </div>
          </div>
        )}

        {/* Final Status */}
        {status === 'active' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-lg font-semibold text-green-900 mb-2">Implementation Complete!</h3>
            <p className="text-green-700">
              A pull request has been created in your repository. Review and merge it to activate the experiment.
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Implementation Failed</h3>
            <p className="text-red-700">
              There was an error implementing your experiment. Please try again or contact support.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
