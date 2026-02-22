import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';
import { Loader2, Trophy, TrendingUp } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
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

interface ExperimentResultsPanelProps {
  experimentId: number;
  isLoading?: boolean;
}

export const ExperimentResultsPanel = ({ experimentId, isLoading: externalLoading }: ExperimentResultsPanelProps) => {
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

  const renderChart = (plot: Plot, _size: 'large' | 'small' = 'small') => {
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: '#e2e8f0',
            font: {
              size: 11,
            },
          },
        },
        title: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#94a3b8',
            font: {
              size: 10,
            },
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
        },
        y: {
          ticks: {
            color: '#94a3b8',
            font: {
              size: 10,
            },
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
    };

    switch (plot.type) {
      case 'bar':
        return <Bar data={plot.data} options={chartOptions} />;
      case 'line':
        return <Line data={plot.data} options={chartOptions} />;
      case 'pie':
        return <Pie data={plot.data} options={{
          ...chartOptions,
          scales: undefined,
        }} />;
      default:
        return <div className="text-xs text-slate-500">Unsupported chart type</div>;
    }
  };

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          badge: 'bg-red-500/20 text-red-400',
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          badge: 'bg-yellow-500/20 text-yellow-400',
        };
      case 'low':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-400',
        };
      default:
        return {
          bg: 'bg-white/5',
          border: 'border-white/10',
          text: 'text-slate-400',
          badge: 'bg-white/10 text-slate-400',
        };
    }
  };

  if (loading || externalLoading) {
    return (
      <GlassPanel className="rounded-lg flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <Loader2 className="w-12 h-12 text-primary-glow animate-spin mb-4" />
          <p className="text-sm text-slate-400">Analyzing results...</p>
          <p className="text-xs text-slate-500 mt-1">This may take a moment</p>
        </div>
      </GlassPanel>
    );
  }

  if (error) {
    return (
      <GlassPanel className="rounded-lg">
        <div className="p-6 text-center">
          <div className="size-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Error Loading Results</h3>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      </GlassPanel>
    );
  }

  if (!analysis) {
    return (
      <GlassPanel className="rounded-lg">
        <div className="p-6 text-center">
          <p className="text-sm text-slate-400">Results not available yet.</p>
        </div>
      </GlassPanel>
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
    <div className="space-y-3 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
      {/* Winner Banner */}
      {analysis.winning_segment && (
        <GlassPanel className="rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/30">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 rounded-full p-2 shrink-0">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white mb-0.5">Winner: {analysis.winning_segment.name}</h2>
                {analysis.analysis.winner_recommendation && (
                  <p className="text-xs text-emerald-400/90">{analysis.analysis.winner_recommendation.reasoning}</p>
                )}
              </div>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Summary */}
      {analysis.analysis.summary && (
        <GlassPanel className="rounded-lg">
          <div className="p-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-primary-glow shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">{analysis.analysis.summary}</p>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Primary Chart - Large */}
      {primaryPlot && (
        <GlassPanel title={primaryPlot.title} className="rounded-lg">
          <div className="p-4">
            <p className="text-xs text-slate-400 mb-3">{primaryPlot.description}</p>
            <div style={{ height: '300px' }}>
              {renderChart(primaryPlot, 'large')}
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Secondary Charts - Small Grid */}
      {secondaryPlots.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {secondaryPlots.map((plot, index) => (
            <GlassPanel key={index} title={plot.title} className="rounded-lg">
              <div className="p-3">
                <div style={{ height: '150px' }}>
                  {renderChart(plot, 'small')}
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Insights List */}
      {analysis.analysis.insights && analysis.analysis.insights.length > 0 && (
        <GlassPanel title="Insights" className="rounded-lg">
          <div className="p-3 space-y-2">
            {analysis.analysis.insights.map((insight, index) => {
              const colors = getSeverityColors(insight.severity);
              return (
                <div
                  key={index}
                  className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className={`font-semibold text-xs ${colors.text}`}>{insight.title}</h4>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${colors.badge} shrink-0`}>
                      {insight.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mb-2">{insight.description}</p>
                  <p className="text-xs italic text-slate-400">💡 {insight.recommendation}</p>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      )}
    </div>
  );
};
