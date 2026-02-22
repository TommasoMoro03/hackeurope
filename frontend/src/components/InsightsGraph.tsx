import { useMemo } from 'react';

interface Insight {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  metrics: Record<string, any>;
  recommendation: string;
}

interface InsightsGraphProps {
  insights: Insight[];
  summary?: string;
}

export const InsightsGraph = ({ insights, summary }: InsightsGraphProps) => {
  // Group insights by category
  const groupedInsights = useMemo(() => {
    const groups = new Map<string, Insight[]>();
    insights.forEach((insight) => {
      if (!groups.has(insight.category)) {
        groups.set(insight.category, []);
      }
      groups.get(insight.category)!.push(insight);
    });
    return Array.from(groups.entries());
  }, [insights]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-400 bg-red-50';
      case 'medium':
        return 'border-yellow-400 bg-yellow-50';
      case 'low':
        return 'border-blue-400 bg-blue-50';
      default:
        return 'border-gray-400 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance':
        return 'border-purple-400 bg-purple-50';
      case 'engagement':
        return 'border-green-400 bg-green-50';
      case 'conversion':
        return 'border-pink-400 bg-pink-50';
      case 'behavior':
        return 'border-cyan-400 bg-cyan-50';
      default:
        return 'border-gray-400 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* Central Summary Box */}
      <div className="flex justify-center mb-8">
        <div className="border-2 border-gray-700 bg-gray-100 rounded-lg p-4 shadow-lg max-w-xl">
          <h3 className="font-bold text-gray-900 text-center mb-2">Summary</h3>
          <p className="text-sm text-gray-700 text-center">
            {summary || 'Experiment analysis complete'}
          </p>
        </div>
      </div>

      {/* Connecting Lines */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-px bg-gray-300 h-12 z-0"></div>

      {/* Category Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {groupedInsights.map(([category, categoryInsights]) => (
          <div key={category} className="space-y-3">
            {/* Category Header */}
            <div className={`border-2 ${getCategoryColor(category)} rounded-lg p-3 shadow-md`}>
              <h4 className="font-bold text-gray-900 capitalize">{category}</h4>
              <p className="text-xs text-gray-600 mt-1">
                {categoryInsights.length} insight{categoryInsights.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Connecting line from category to insights */}
            <div className="flex justify-center">
              <div className="w-px bg-gray-300 h-4"></div>
            </div>

            {/* Insights for this category */}
            <div className="space-y-3">
              {categoryInsights.map((insight, index) => (
                <div
                  key={index}
                  className={`border-2 ${getSeverityColor(insight.severity)} rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <h5 className="font-bold text-gray-900 text-sm mb-1">
                    {insight.title}
                  </h5>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {insight.description.length > 100
                      ? insight.description.substring(0, 100) + '...'
                      : insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-red-400 bg-red-50 rounded"></div>
            <span className="text-gray-600">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-yellow-400 bg-yellow-50 rounded"></div>
            <span className="text-gray-600">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-400 bg-blue-50 rounded"></div>
            <span className="text-gray-600">Low Priority</span>
          </div>
        </div>
      </div>
    </div>
  );
};
