import axiosInstance from "./axiosInstance";

// export const API_URL = "https://inventorymanagementapi-0f3a.onrender.com/api/";
// export const API_URL = "http://localhost:5273/api/";
export const API_URL = "https://api.kftech237.com/api/";



export const getProduits = async () => {
  const response = await axiosInstance.get(`${API_URL}Products`);
  return response.data;
};
  export const getProduit = async (id) => {
    const response = await axiosInstance.get(`${API_URL}Products/${id}`);
    return response.data;
  };
export const getCategories = async () => {
  const response = await axiosInstance.get(`${API_URL}Categories/`);
  return response.data;
};
export const getClients = async () => {
  const response = await axiosInstance.get(`${API_URL}Customers/`);
  return response.data;
};
export const getClient = async (id) => {
  const response = await axiosInstance.get(`${API_URL}Customers/${id}`);
  return response.data;
};
export const getFournisseurs = async () => {
  const response = await axiosInstance.get(`${API_URL}Suppliers/`);
  return response.data;
};
export const getFournisseur = async (id) => {
  const response = await axiosInstance.get(`${API_URL}Suppliers/${id}`);
  return response.data;
};
export const getMouvements = async () => {
  const response = await axiosInstance.get(`${API_URL}Movements/`);
  return response.data;
};
export const getCommandesClient = async () => {
  const response = await axiosInstance.get(`${API_URL}Orders/`);
  return response.data;
};
export const getCommandeClient = async (id) => {
  const response = await axiosInstance.get(`${API_URL}Orders/${id}`);
  return response.data;
};
export const getCommandesFournisseur = async () => {
  const response = await axiosInstance.get(`${API_URL}Provides/`);
  return response.data;
};
export const getCommandeFournisseur = async (id) => {
  const response = await axiosInstance.get(`${API_URL}Provides/${id}`);
  return response.data;
};
export const getUsers = async () => {
  const response = await axiosInstance.get(`${API_URL}users/`);
  return response.data;
};

// ─── Produits e-commerce (avec infos promo) ───────────────────────────────────
export const getEcomProducts = async (params = {}) => {
  const response = await axiosInstance.get(`${API_URL}ecom/products`, { params });
  return response.data.produits ?? response.data;
};

// ─── Événements ───────────────────────────────────────────────────────────────
export const getEcomEvents = async () => {
  const response = await axiosInstance.get(`${API_URL}ecom/events`);
  return response.data;
};
export const getAllEvents = async (includeExpired = false) => {
  const response = await axiosInstance.get(`${API_URL}events`, {
    params: includeExpired ? { includeExpired: true } : {},
  });
  return response.data;
};
export const getEventProducts = async (id) => {
  const response = await axiosInstance.get(`${API_URL}events/${id}/products`);
  return response.data;
};
export const createEvent = async (data) => {
  const response = await axiosInstance.post(`${API_URL}events`, data);
  return response.data;
};
export const updateEvent = async (id, data) => {
  const response = await axiosInstance.put(`${API_URL}events/${id}`, data);
  return response.data;
};
export const deleteEvent = async (id) => {
  await axiosInstance.delete(`${API_URL}events/${id}`);
};
export const uploadEventImage = async (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  const response = await axiosInstance.post(`${API_URL}events/${id}/image`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ─── Remises ──────────────────────────────────────────────────────────────────
export const getActiveDiscounts = async () => {
  const response = await axiosInstance.get(`${API_URL}discounts/active`);
  return response.data;
};
export const getDiscounts = async (params = {}) => {
  const response = await axiosInstance.get(`${API_URL}discounts`, { params });
  return response.data;
};
export const createDiscount = async (data) => {
  const response = await axiosInstance.post(`${API_URL}discounts`, data);
  return response.data;
};
export const updateDiscount = async (id, data) => {
  const response = await axiosInstance.put(`${API_URL}discounts/${id}`, data);
  return response.data;
};
export const deleteDiscount = async (id) => {
  await axiosInstance.delete(`${API_URL}discounts/${id}`);
};