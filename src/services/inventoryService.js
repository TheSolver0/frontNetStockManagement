import axiosInstance from "./axiosInstance";

// const API_URL = 'http://localhost:5273/api'; 
// const API_URL = "http://187.124.210.239:8080/api";
// export const API_URL = "http://localhost:5273/api"; 
export const API_URL = "https://api.kftech237.com/api";


const inventoryService = {
  createSession: async (data) => {
  const payload = {
    dto: {
      type: data.type,
      categoryIds: data.categoryIds,
      userId: String(data.userId ?? ''),
      notes: data.notes || ''
    }
  };
  console.log('Payload final:', JSON.stringify(payload, null, 2));
  const response = await axiosInstance.post('/Inventory/sessions', payload);
  return response.data;
},

  getAllSessions: async () => {
    const response = await axiosInstance.get('/Inventory/sessions');
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await axiosInstance.get(`/Inventory/sessions/${id}`);
    return response.data;
  },

  getPendingLines: async (sessionId) => {
    const response = await axiosInstance.get(`/Inventory/sessions/${sessionId}/pending-lines`);
    return response.data;
  },

  recordCount: async (lineId, data) => {
    const response = await axiosInstance.post(`/Inventory/lines/${lineId}/count`, data);
    return response.data;
  },

  validateSession: async (sessionId, userId) => {
    const response = await axiosInstance.post(
      `/Inventory/sessions/${sessionId}/validate`,
      JSON.stringify(userId),
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  },

  getStockMovements: async () => {
    const response = await axiosInstance.get('/StockMovements');
    return response.data;
  },

  getProductMovements: async (productId) => {
    const response = await axiosInstance.get(`/StockMovements/product/${productId}`);
    return response.data;
  }
};

export default inventoryService;