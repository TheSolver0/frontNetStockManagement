import axios from 'axios';

const API_URL = 'http://localhost:5273/api'; 

const inventoryService = {
  // Créer une session d'inventaire
  createSession: async (data) => {
    const response = await axios.post(`${API_URL}/Inventory/sessions`, data);
    return response.data;
  },

  // Récupérer toutes les sessions
  getAllSessions: async () => {
    const response = await axios.get(`${API_URL}/Inventory/sessions`);
    return response.data;
  },

  // Récupérer une session par ID
  getSessionById: async (id) => {
    const response = await axios.get(`${API_URL}/Inventory/sessions/${id}`);
    return response.data;
  },

  // Récupérer les lignes en attente
  getPendingLines: async (sessionId) => {
    const response = await axios.get(
      `${API_URL}/Inventory/sessions/${sessionId}/pending-lines`
    );
    return response.data;
  },

  // Enregistrer un comptage
  recordCount: async (lineId, data) => {
    const response = await axios.post(
      `${API_URL}/Inventory/lines/${lineId}/count`,
      data
    );
    return response.data;
  },

  // Valider une session
  validateSession: async (sessionId, userId) => {
    const response = await axios.post(
      `${API_URL}/Inventory/sessions/${sessionId}/validate`,
      JSON.stringify(userId),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  },

  // Récupérer les mouvements de stock
  getStockMovements: async () => {
    const response = await axios.get(`${API_URL}/StockMovements`);
    return response.data;
  },

  // Récupérer les mouvements d'un produit
  getProductMovements: async (productId) => {
    const response = await axios.get(`${API_URL}/StockMovements/product/${productId}`);
    return response.data;
  }
};

export default inventoryService;