export interface User {
  id: number;
  email: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  preferMode: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoadTile {
  tileId: number;
  latitude: number;
  longitude: number;
  difficulty: number; // 0~100
  explanation: string;
}

export interface TileScore {
  id: number;
  roadTileId: number;
  slopeAvg: number;
  congestion: number;
  accidentRate: number;
  laneWidth: number;
  intersectionCount: number;
}

export interface Route {
  id: number;
  startLocation: string;
  endLocation: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude: number;
  endLongitude: number;
  distance: number;
  avgDifficulty: number;
  polyline: string;
  estimatedTime: number;
  createdAt: string;
}

export interface Feedback {
  id: number;
  userId: number;
  routeId: number;
  difficultyScore: number;
  reportType: string;
  comment: string;
  createdAt: string;
}

export interface SurveyQuestion {
  id: number;
  question: string;
  options: string[];
}

export interface SurveyAnswer {
  questionId: number;
  answer: number; // 1-5 Likert scale
}
