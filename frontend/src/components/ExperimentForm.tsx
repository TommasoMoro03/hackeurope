import { Button } from '@/components/Button';
import { useState } from 'react';

interface Segment {
  name: string;
  instructions: string;
}

interface ExperimentFormData {
  name: string;
  description: string;
  percentage: number;
  numSegments: number;
  metrics: string;
  segments: Segment[];
}

interface ExperimentFormProps {
  onSubmit: (data: ExperimentFormData) => void;
}

export const ExperimentForm = ({ onSubmit }: ExperimentFormProps) => {
  const [form, setForm] = useState<ExperimentFormData>({
    name: '',
    description: '',
    percentage: 100,
    numSegments: 2,
    metrics: '',
    segments: [
      { name: '', instructions: '' },
      { name: '', instructions: '' },
    ],
  });

  const handleNumSegmentsChange = (num: number) => {
    const newSegments = Array.from({ length: num }, (_, i) =>
      form.segments[i] || { name: '', instructions: '' }
    );
    setForm({ ...form, numSegments: num, segments: newSegments });
  };

  const handleSegmentChange = (index: number, field: 'name' | 'instructions', value: string) => {
    const newSegments = [...form.segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setForm({ ...form, segments: newSegments });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Experiment</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Percentage of Users Involved</label>
          <input
            type="number"
            min="1"
            max="100"
            value={form.percentage}
            onChange={(e) => setForm({ ...form, percentage: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Segments</label>
          <input
            type="number"
            min="2"
            max="10"
            value={form.numSegments}
            onChange={(e) => handleNumSegmentsChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Metrics</label>
          <textarea
            value={form.metrics}
            onChange={(e) => setForm({ ...form, metrics: e.target.value })}
            rows={3}
            placeholder="Define metrics to track..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Segments</h3>
          {form.segments.map((segment, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Segment {index + 1}</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={segment.name}
                    onChange={(e) => handleSegmentChange(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                  <textarea
                    value={segment.instructions}
                    onChange={(e) => handleSegmentChange(index, 'instructions', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button type="submit">Create Experiment</Button>
      </form>
    </div>
  );
};
