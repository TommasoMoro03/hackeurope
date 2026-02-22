export interface Segment {
  id: number;
  name: string;
  instructions: string;
  percentage: number;
}

export interface Experiment {
  id: number;
  name: string;
  description: string;
  status: string;
  percentage: number;
  metrics: string;
  preview_url?: string;
  pr_url?: string;
  segment_preview_hashes?: Record<string, string>;
  segments: Segment[];
  created_at: string;
  winning_segment_id?: number;
}
