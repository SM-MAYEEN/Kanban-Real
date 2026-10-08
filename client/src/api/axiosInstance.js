import axios from 'axios';

const defaultApiUrl = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://kanban-backend-kgfk.onrender.com/api';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;