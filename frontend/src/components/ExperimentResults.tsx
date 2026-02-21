import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { InsightsGraph } from './InsightsGraph';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Plot {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
  description: string;
}

interface Insight {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  metrics: Record<string, any>;
  recommendation: string;
}

interface WinnerRecommendation {
  segment_name: string;
  confidence: string;
  reasoning: string;
}

interface AnalysisData {
  plots: Plot[];
  insights: Insight[];
  summary: string;
  winner_recommendation?: WinnerRecommendation;
  raw_data: any;
}

interface AnalysisResponse {
  id: number;
  experiment_id: number;
  status: string;
  created_at: string;
  analysis: AnalysisData;
  winning_segment_id?: number;
  winning_segment?: {
    id: number;
    name: string;
    instructions: string;
  };
}

interface ExperimentResultsProps {
  experimentId: number;
  experimentName: string;
}

export const ExperimentResults = ({ experimentId, experimentName }: ExperimentResultsProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, [experimentId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/experiments/${experimentId}/analysis`);
      setAnalysis(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (plot: Plot, size: 'large' | 'small' = 'small') => {
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false,
        },
      },
    };

    switch (plot.type) {
      case 'bar':
        return <Bar data={plot.data} options={chartOptions} />;
      case 'line':
        return <Line data={plot.data} options={chartOptions} />;
      case 'pie':
        return <Pie data={plot.data} options={chartOptions} />;
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Results</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-700">Results not available yet.</p>
      </div>
    );
  }

  // Find the primary plot (CTR or click-through related)
  const primaryPlot = analysis.analysis.plots?.find(p =>
    p.title.toLowerCase().includes('ctr') ||
    p.title.toLowerCase().includes('click') ||
    p.title.toLowerCase().includes('conversion')
  ) || analysis.analysis.plots?.[0];

  const secondaryPlots = analysis.analysis.plots?.filter(p => p !== primaryPlot) || [];

  return (
    <div className="space-y-6">
      {/* Winner Banner */}
      {analysis.winning_segment && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Winner: {analysis.winning_segment.name}</h2>
              {analysis.analysis.winner_recommendation && (
                <p className="text-green-100">{analysis.analysis.winner_recommendation.reasoning}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {analysis.analysis.summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 text-sm">{analysis.analysis.summary}</p>
        </div>
      )}

      {/* Primary Chart - Large */}
      {primaryPlot && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{primaryPlot.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{primaryPlot.description}</p>
          <div style={{ height: '400px' }}>
            {renderChart(primaryPlot, 'large')}
          </div>
        </div>
      )}

      {/* Secondary Charts - Small Grid */}
      {secondaryPlots.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {secondaryPlots.map((plot, index) => (
            <div key={index} className="bg-white rounded-lg shadow border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">{plot.title}</h4>
              <div style={{ height: '150px' }}>
                {renderChart(plot, 'small')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights Graph Visualization */}
      {analysis.analysis.insights && analysis.analysis.insights.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Insights Overview</h3>
          <InsightsGraph
            insights={analysis.analysis.insights}
            summary={analysis.analysis.summary}
          />
        </div>
      )}

      {/* Insights List - Compact */}
      {analysis.analysis.insights && analysis.analysis.insights.length > 0 && (
        <div className="space-y-3">
          {analysis.analysis.insights.map((insight, index) => (
            <div
              key={index}
              className={`rounded-lg border p-4 ${getSeverityColor(insight.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                  <p className="text-xs mb-2">{insight.description}</p>
                  <p className="text-xs italic">💡 {insight.recommendation}</p>
                </div>
                <span className="text-xs uppercase font-bold px-2 py-1 rounded bg-white/50">
                  {insight.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
