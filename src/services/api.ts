import axios, { type AxiosRequestConfig } from 'axios';

// Axios 인스턴스 생성
// VITE_API_BASE_URL이 정의되어 있으면 그걸 사용 (Docker는 18080, 로컬 dev는 8080)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request 인터셉터 — 매 요청에 토큰 자동 첨부
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response 인터셉터 — 401 시 refresh_token으로 자동 재발급 후 원래 요청 재시도
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const flushQueue = (newToken: string | null) => {
  pendingQueue.forEach((cb) => cb(newToken));
  pendingQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url: string = originalRequest?.url ?? '';

    // refresh 자체가 401이면 재시도 X (무한 루프 방지)
    if (status !== 401 || originalRequest._retry || url.includes('/api/auth/refresh') || url.includes('/api/auth/login')) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      // refresh 없음 → 로그아웃 처리
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // 이미 다른 요청이 refresh 진행 중 → 큐에 대기
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (newToken) {
            originalRequest.headers = originalRequest.headers ?? {};
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }

    isRefreshing = true;
    try {
      const res = await axios.post(
        `${api.defaults.baseURL}/api/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const newAccess = res.data.access_token as string;
      const newRefresh = res.data.refresh_token as string;
      localStorage.setItem('token', newAccess);
      localStorage.setItem('refreshToken', newRefresh);
      // currentUser도 갱신
      localStorage.setItem(
        'currentUser',
        JSON.stringify({
          userId: res.data.user_id,
          nickname: res.data.nickname,
          skillLevel: res.data.skill_level,
          primaryVulnerabilityTypeId: res.data.primary_vulnerability_type_id,
          role: res.data.role === 'ADMIN' ? 'ADMIN' : 'USER',
        })
      );
      flushQueue(newAccess);
      // 원래 요청 재시도
      originalRequest.headers = originalRequest.headers ?? {};
      (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshErr) {
      flushQueue(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      // refresh 토큰도 만료 → 로그인 페이지로 강제 이동
      // 단 이미 login/signup 페이지면 무한 redirect 방지
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/signup') {
        const target = encodeURIComponent(path + window.location.search);
        window.location.href = `/login?next=${target}`;
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
