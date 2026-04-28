import { io, Socket } from "socket.io-client";
import { ensureFreshSession } from "@/lib/apiClient";

let socket: Socket | null = null;
let reconnectAfterRefresh: Promise<boolean> | null = null;

const SOCKET_BASE =
  process.env.NEXT_PUBLIC_SOCKET_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:4000";

export function getSocket() {
  if (socket) return socket;
  socket = io(SOCKET_BASE, {
    withCredentials: true,
  });

  const refreshAndReconnect = () => {
    if (!socket || socket.connected) {
      return;
    }

    if (!reconnectAfterRefresh) {
      reconnectAfterRefresh = ensureFreshSession().finally(() => {
        reconnectAfterRefresh = null;
      });
    }

    void reconnectAfterRefresh.then((refreshed) => {
      if (refreshed && socket && !socket.connected) {
        socket.connect();
      }
    });
  };

  socket.on("connect_error", refreshAndReconnect);
  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      refreshAndReconnect();
    }
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
  socket = null;
}
