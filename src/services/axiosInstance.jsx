// axiosInstance.js
import axios from 'axios';

const baseURL = 'http://localhost:8000'; // à adapter selon ton API

const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Intercepteur de requêtes
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponses
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si token expiré
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh');
        const response = await axios.post(`${baseURL}/auth/refresh/`, {
          refresh: refreshToken
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access', newAccessToken);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest); // relance la requête
      } catch (err) {
        console.error("Échec du refresh token, redirection vers login.");
        localStorage.clear();
        window.location.href = '/login'; // ou autre route
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
