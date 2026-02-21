interface ExperimentMergePRProps {
  experimentName: string;
  onMerged: () => void;
}

export const ExperimentMergePR = ({ experimentName, onMerged }: ExperimentMergePRProps) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-6">
            <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Pull Request Created!
          </h2>

          {/* Description */}
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            A pull request has been created for <span className="font-semibold">{experimentName}</span>.
            Please merge the PR in your GitHub repository so the experiment can start.
          </p>

          {/* Steps */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Next Steps:</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>Go to your GitHub repository</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>Review and merge the pull request</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>Come back here and click the button below</span>
              </li>
            </ol>
          </div>

          {/* Button */}
          <button
            onClick={onMerged}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg shadow-lg"
          >
            I Merged the PR
          </button>

          {/* Helper text */}
          <p className="text-xs text-gray-500 mt-4">
            Once you merge the PR, the experiment will become active
          </p>
        </div>
      </div>
    </div>
  );
};
