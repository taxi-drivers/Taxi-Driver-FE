import api from './api';

export interface MyProfile {
  user_id: number;
  email: string;
  nickname: string | null;
  skill_level: number | null;
  primary_vulnerability_type_id: number | null;
  primary_vulnerability_type_code?: string | null;
  primary_vulnerability_type_name?: string | null;
  vulnerability_type_ids?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface MySurveyHistoryItem {
  survey_history_id: number;
  survey_version: string;
  skill_level: number;
  vulnerability_type_ids: number[];
  primary_vulnerability_type_id: number | null;
  answers: Record<string, number>;
  created_at: string;
}

export interface MySurveyHistoryResponse {
  user_id: number;
  histories: MySurveyHistoryItem[];
}

export const fetchMyProfile = async (): Promise<MyProfile> => {
  const res = await api.get<MyProfile>('/api/users/me/profile');
  return res.data;
};

export const fetchMySurveyHistory = async (): Promise<MySurveyHistoryResponse> => {
  const res = await api.get<MySurveyHistoryResponse>('/api/users/me/survey/history');
  return res.data;
};

export const updateMyNickname = async (nickname: string) => {
  const res = await api.patch('/api/users/me/profile', { nickname });
  return res.data;
};

export const deleteMyAccount = async () => {
  await api.delete('/api/users/me');
};
