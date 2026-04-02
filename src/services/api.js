import axios from "axios";
import axiosInstance from "./axiosInstance";

export const API_URL = "https://inventorymanagementapi-0f3a.onrender.com/api/";
// export const API_URL = "http://localhost:5273/api/";


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
  const response = await axiosInstance.get(`${API_URL}gerants/`);
  return response.data;
};