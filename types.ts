export interface ConfidenceAxes {
  evidence: number;
  reasoning: number;
  calibration: number;
  source: number;
  domain: number;
  coherence: number;
  meta: number;
}

export interface CCSConfig {
  weights: Record<keyof ConfidenceAxes, number>;
  floors: Partial<Record<keyof ConfidenceAxes, number>>;
}

export interface CCSResult {
  score: number;
  axes: ConfidenceAxes;
  weakAxes: (keyof ConfidenceAxes)[];
  profile: 'strong' | 'mixed' | 'weak' | 'collapsed';
}
