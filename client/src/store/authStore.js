import { create } from 'zustand';
import API from '../api/axiosInstance';
import { initSocket, disconnectSocket } from '../socket/socketClient';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user_details')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  fetchCurrentUser: async () => {
    try {
      const res = await API.get('/auth/me');
      set({ user: res.data.user });
      localStorage.setItem('user_details', JSON.stringify(res.data.user));
    } catch (err) {
      console.error('Failed to fetch profile', err);
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await API.post('/auth/register', { name, email, password });
      const { user, token } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user_details', JSON.stringify(user));

      try {
        const socket = initSocket(token);
        if (socket) socket.connect();
      } catch (sErr) {
        console.warn('Socket connect warning on register:', sErr);
      }

      set({ user, token, isAuthenticated: true, loading: false });
      return true;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Registration failed';
      set({ error: errorMsg, loading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await API.post('/auth/login', { email, password });
      const { user, token } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user_details', JSON.stringify(user));

      try {
        const socket = initSocket(token);
        if (socket) socket.connect();
      } catch (sErr) {
        console.warn('Socket connect warning on login:', sErr);
      }

      set({ user, token, isAuthenticated: true, loading: false });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Login failed',
        loading: false,
      });
      return false;
    }
  },

  updateProfileData: async (profilePayload) => {
    set({ loading: true, error: null });
    try {
      const res = await API.put('/auth/profile', profilePayload);
      const updatedUser = res.data.user;

      localStorage.setItem('user_details', JSON.stringify(updatedUser));
      set({ user: updatedUser, loading: false });
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to update profile',
        loading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_details');
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));