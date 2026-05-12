import api from './api';

export interface AdminVulnerabilityType {
  vulnerability_type_id: number;
  code: string;
  name: string;
  description: string | null;
  icon_key: string | null;
}

export interface AdminUserSummary {
  user_id: number;
  email: string;
  nickname: string | null;
  role: 'USER' | 'ADMIN';
  active: boolean;
  skill_level: number | null;
  primary_vulnerability_type_id: number | null;
  vulnerability_type_ids: number[];
  vulnerability_types: AdminVulnerabilityType[];
  survey_history_count: number;
  latest_survey_at: string | null;
  created_at: string | null;
}

export interface AdminUserDetail extends AdminUserSummary {
  updated_at: string | null;
}

export interface AdminSurveyHistoryItem {
  survey_history_id: number;
  survey_version: string;
  skill_level: number;
  vulnerability_type_ids: number[];
  primary_vulnerability_type_id: number | null;
  answers: Record<string, number>;
  created_at: string | null;
}

export const getAdminUsers = async () => {
  const response = await api.get<{ count: number; users: AdminUserSummary[] }>('/api/admin/users');
  return response.data;
};

export const getAdminUser = async (userId: number) => {
  const response = await api.get<AdminUserDetail>(`/api/admin/users/${userId}`);
  return response.data;
};

export const getAdminSurveyHistory = async (userId: number) => {
  const response = await api.get<{ user_id: number; histories: AdminSurveyHistoryItem[] }>(
    `/api/admin/users/${userId}/survey-history`
  );
  return response.data;
};

export const updateAdminUserRole = async (userId: number, role: 'USER' | 'ADMIN') => {
  const response = await api.patch<AdminUserDetail>(`/api/admin/users/${userId}/role`, { role });
  return response.data;
};

export const updateAdminUserStatus = async (userId: number, active: boolean) => {
  const response = await api.patch<AdminUserDetail>(`/api/admin/users/${userId}/status`, { active });
  return response.data;
};
