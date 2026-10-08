import axios from 'axios';

const defaultApiUrl = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://kanban-backend-kgfk.onrender.com/api';

export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl;
export const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL
  || new URL(API_BASE_URL).origin;

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;