import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (!socket) {
    const defaultSocketUrl = import.meta.env.DEV
      ? 'http://localhost:5000'
      : 'https://kanban-backend-kgfk.onrender.com';
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl;
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    if (token) return initSocket(token);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};