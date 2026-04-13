import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_BASE =
  process.env.NEXT_PUBLIC_SOCKET_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:4000";

export function getSocket() {
  if (socket) return socket;
  socket = io(SOCKET_BASE, {
    withCredentials: true,
    transports: ["websocket"],
  });
  return socket;
}
