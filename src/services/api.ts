import axios from 'axios';

// Axios 인스턴스 생성 - 백엔드 포트 8080
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request 인터셉터
api.interceptors.request.use(
  (config) => {
    // 필요시 토큰 추가
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 에러 처리
    if (error.response?.status === 401) {
      // 인증 실패 처리
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
