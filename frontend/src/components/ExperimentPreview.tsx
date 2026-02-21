import { useState } from 'react';

interface Segment {
  id: number;
  name: string;
  instructions: string;
  percentage: number;
}

interface ExperimentPreviewProps {
  experimentId: number;
  experimentName: string;
  segments: Segment[];
  projectUrl?: string;
}

export const ExperimentPreview = ({ segments, projectUrl }: ExperimentPreviewProps) => {
  const [previewError, setPreviewError] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState<number | null>(segments[0]?.id || null);

  // All segments use the same URL - segmentation happens on the backend/randomly
  const getSegmentUrl = () => {
    return projectUrl || null;
  };

  const selectedSegment = segments.find(s => s.id === selectedSegmentId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Live Preview
        </h3>
        <div className="text-sm text-gray-500">
          Viewing variant previews
        </div>
      </div>

      {/* Preview Error Message */}
      {previewError || !projectUrl ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Preview Not Available</h4>
              <p className="text-sm text-yellow-800 mb-3">
                The live preview cannot be displayed at this time. This may be due to:
              </p>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside mb-4">
                <li>The website is not deployed yet or deployment URL is not configured</li>
                <li>iframe embedding is blocked by the website's security policy (X-Frame-Options)</li>
                <li>The PR changes haven't been deployed to a preview environment</li>
              </ul>
              <div className="bg-white rounded p-4 border border-yellow-300">
                <p className="text-sm font-medium text-gray-900 mb-2">Manual Testing Instructions:</p>
                <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                  <li>Deploy the PR branch to a preview environment (e.g., Vercel, Netlify)</li>
                  <li>Visit the application URL multiple times to see different segments (users are randomly assigned to segments)</li>
                  <li>The application URL is the same for all segments - segmentation happens automatically based on user session</li>
                  <li className="mt-2">Test the functionality for each variant</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Segment Selector */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            {segments.map((segment) => (
              <button
                key={segment.id}
                onClick={() => setSelectedSegmentId(segment.id)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  selectedSegmentId === segment.id
                    ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {segment.name}
              </button>
            ))}
          </div>

          {/* Preview iframe */}
          {selectedSegment && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm text-gray-600 ml-3">
                    {getSegmentUrl()}
                  </span>
                </div>
                <a
                  href={getSegmentUrl() || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Open in new tab
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              <div className="relative" style={{ height: '600px' }}>
                <iframe
                  src={getSegmentUrl() || ''}
                  className="w-full h-full"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  onError={() => setPreviewError(true)}
                  title={`Preview - ${selectedSegment.name} segment`}
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Viewing: {selectedSegment.name}
                </div>
              </div>
            </div>
          )}

          {/* Segment Info */}
          {selectedSegment && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">{selectedSegment.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{selectedSegment.instructions}</p>
              <p className="text-xs text-gray-500">
                Traffic allocation: {(selectedSegment.percentage * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
