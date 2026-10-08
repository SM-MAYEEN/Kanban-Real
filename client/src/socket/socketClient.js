import { io } from 'socket.io-client';
import { SOCKET_BASE_URL } from '../api/axiosInstance';

let socket = null;

export const initSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
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