import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:5000/api', // localhost এর জায়গায় 127.0.0.1 ব্যবহার করা সবচেয়ে নিরাপদ
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;