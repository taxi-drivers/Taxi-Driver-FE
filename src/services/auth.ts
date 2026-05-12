import api from './api';

export interface AuthResponse {
  user_id: number;
  nickname: string | null;
  skill_level: number | null;
  primary_vulnerability_type_id: number | null;
  access_token: string;
  refresh_token: string;
  role?: string;
}

export interface CurrentUser {
  userId: number;
  nickname: string | null;
  skillLevel: number | null;
  primaryVulnerabilityTypeId: number | null;
  role: 'USER' | 'ADMIN';
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
      role: response.role === 'ADMIN' ? 'ADMIN' : 'USER',
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

export const isAdmin = () => getCurrentUser()?.role === 'ADMIN';

export const login = async (email: string, password: string) => {
  const response = await api.post<AuthResponse>('/api/auth/login', { email, password });
  saveAuthSession(response.data);
  return response.data;
};

export const signup = async (email: string, password: string, nickname: string) => {
  const response = await api.post<AuthResponse>('/api/auth/signup', { email, password, nickname });
  saveAuthSession(response.data);
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }
};

/** 토큰 만료 시 호출. refresh_token으로 새 access_token 받아 저장. */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const res = await api.post<AuthResponse>('/api/auth/refresh', { refresh_token: refreshToken });
    saveAuthSession(res.data);
    return res.data.access_token;
  } catch {
    return null;
  }
};
