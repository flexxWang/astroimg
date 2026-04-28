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
  });
  if (process.env.NODE_ENV === "development") {
    socket.on("connect", () => {
      // eslint-disable-next-line no-console
      console.info("[socket] connected", socket?.id);
    });
    socket.on("connect_error", (error) => {
      // eslint-disable-next-line no-console
      console.warn("[socket] connect_error", error.message);
    });
    socket.on("disconnect", (reason) => {
      // eslint-disable-next-line no-console
      console.info("[socket] disconnected", reason);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
}
