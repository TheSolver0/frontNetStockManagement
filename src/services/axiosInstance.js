import axios from 'axios';

const baseURL = 'http://localhost:5273/api'; // à adapter selon ton API

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
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✓ Token ajouté à la requête:', config.url);
    } else {
      console.warn('⚠ Pas de token trouvé pour:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✓ Réponse API:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error('❌ Erreur API:', error.response?.status, error.response?.statusText, originalRequest?.url);
    console.error('Détails erreur:', error.response?.data);

    // Si token expiré
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('🔄 Tentative de refresh avec token:', refreshToken ? 'présent' : 'absent');
        
        const response = await axios.post(`${baseURL}/auth/refresh/`, {
          refresh: refreshToken
        });

        const newAccessToken = response.data.access || response.data.token;
        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          console.log('✓ Token rafraîchi, nouvelle requête lancée');
        }

        return axiosInstance(originalRequest); // relance la requête
      } catch (err) {
        console.error("❌ Échec du refresh token:", err.response?.data || err.message);
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
