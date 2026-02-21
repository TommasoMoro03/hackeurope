import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';

interface EventData {
  id: number;
  event_json: {
    event_id: string;
    segment_id: number;
    segment_name: string;
    experiment_id: number;
    project_id: number;
    timestamp: string;
    user_id?: string;
    metadata?: Record<string, any>;
  };
  created_at: string;
}

interface ExperimentDataProps {
  experimentId: number;
}

export const ExperimentData = ({ experimentId }: ExperimentDataProps) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [experimentId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/experiments/${experimentId}/events`);
      setEvents(response.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to load event data');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading event data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No events tracked yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Event Data ({events.length} events)
        </h3>
        <button
          onClick={fetchEvents}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Segment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metadata
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {event.event_json.event_id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {event.event_json.segment_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {event.event_json.user_id || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(event.event_json.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {event.event_json.metadata ? (
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-700">
                        View
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-xs">
                        {JSON.stringify(event.event_json.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
