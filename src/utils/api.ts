import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5000/api',
});

// ✅ Add this interceptor to attach the JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('med_app_token');
    if (token) {
      // Attach the token in the standard 'Bearer <token>' format
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;