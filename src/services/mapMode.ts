import api from './api';

export interface MapEdge {
  edgeId: string;
  difficulty: number;
  coordinatesJson: string;
}

export interface AreaSummary {
  edgeCount: number;
  difficultyDistribution: {
    low: number; mid: number; high: number;
    lowPct: number; midPct: number; highPct: number;
  };
  avgDifficulty: number;
  safetyScore: number;
  warningIndicators: Array<{
    type: string;
    label: string;
    count: number;
    description: string;
  }>;
  summary: string;
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export const fetchEdgesByBounds = async (bounds: Bounds, zoom?: number): Promise<MapEdge[]> => {
  const params: Record<string, number> = { ...bounds };
  if (zoom !== undefined) params.zoom = zoom;
  const res = await api.get<MapEdge[]>('/map/edges', { params });
  return res.data;
};

export const fetchAreaSummary = async (bounds: Bounds): Promise<AreaSummary> => {
  const res = await api.post<AreaSummary>('/map/area-summary', bounds);
  return res.data;
};
