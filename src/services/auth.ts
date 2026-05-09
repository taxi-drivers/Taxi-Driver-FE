import api from './api';

export interface AuthResponse {
  user_id: number;
  nickname: string | null;
  skill_level: number | null;
  primary_vulnerability_type_id: number | null;
  access_token: string;
  refresh_token: string;
}

export interface CurrentUser {
  userId: number;
  nickname: string | null;
  skillLevel: number | null;
  primaryVulnerabilityTypeId: number | null;
}

export const saveAuthSession = (response: AuthResponse) => {
  localStorage.setItem('token', response.access_token);
  localStorage.setItem('refreshToken', response.refresh_token);
  localStorage.setItem(
    'currentUser',
    JSON.stringify({
      userId: response.user_id,
      nickname: response.nickname,
      skillLevel: response.skill_level,
      primaryVulnerabilityTypeId: response.primary_vulnerability_type_id,
    } satisfies CurrentUser)
  );
};

export const getCurrentUser = (): CurrentUser | null => {
  const raw = localStorage.getItem('currentUser');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
};

export const isLoggedIn = () => Boolean(localStorage.getItem('token'));

export const login = async (email: string, password: string) => {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  saveAuthSession(response.data);
  return response.data;
};

export const signup = async (email: string, password: string, nickname: string) => {
  const response = await api.post<AuthResponse>('/auth/signup', { email, password, nickname });
  saveAuthSession(response.data);
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }
};
