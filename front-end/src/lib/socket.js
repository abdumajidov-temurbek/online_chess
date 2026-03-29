import openSocket from 'socket.io-client';
import { API_URL } from './api';

let socket;

export function getSocket() {
  if (!socket) {
    socket = openSocket(API_URL, {
      transports: ['websocket'],
      withCredentials: true,
      path: '/socket.io',
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
}
