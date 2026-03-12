import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  socket = io("http://localhost:4000", {
    withCredentials: true,
    transports: ["websocket"],
  });
  return socket;
}
