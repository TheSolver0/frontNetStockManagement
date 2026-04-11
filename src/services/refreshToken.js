import axios from 'axios';

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
      refresh: refreshToken
    });

    const newAccessToken = response.data.access;
    localStorage.setItem('accessToken', newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Erreur de rafraîchissement du token', error);
    return null;
  }
};
