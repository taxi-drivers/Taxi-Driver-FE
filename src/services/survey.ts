import api from './api';

export interface SurveyQuestionOption {
  value: number;
  label: string;
}

export interface SurveyQuestion {
  code: string;
  category: string;
  prompt: string;
  reverse_scored: boolean;
  options: SurveyQuestionOption[];
}

export interface SurveyQuestionsResponse {
  survey_version: string;
  questions: SurveyQuestion[];
}

export const fetchSurveyQuestions = async (): Promise<SurveyQuestionsResponse> => {
  const res = await api.get<SurveyQuestionsResponse>('/api/survey/questions');
  return res.data;
};

export interface SubmitSurveyPayload {
  skill_level?: number;
  answers: Record<string, number>;
  client_version?: string;
}

export const submitSurvey = async (payload: SubmitSurveyPayload) => {
  const res = await api.post('/api/users/me/survey', payload);
  return res.data;
};
