import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket && socket.connected) return socket;

  const authToken = token || localStorage.getItem('token');
  if (!authToken) return null;

  socket = io('http://127.0.0.1:5000', {
    auth: {
      token: authToken,
    },
    transports: ['websocket', 'polling'], // Fallback transport
  });

  return socket;
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
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