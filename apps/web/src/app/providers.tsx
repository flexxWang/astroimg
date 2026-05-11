"use client";

import * as Sentry from "@sentry/nextjs";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useUserStore } from "@/stores/userStore";
import { fetchMe } from "@/features/users/services/userApi";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { createAppQueryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

export default function Providers({ children }: { children: ReactNode }) {
  const hydrate = useUserStore((state) => state.hydrate);
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);
  const [client] = useState(createAppQueryClient);

  useEffect(() => {
    fetchMe({ errorToast: false })
      .then((result) => {
        setUser(result.data);
        client.setQueryData(queryKeys.auth.me(), result);
      })
      .catch(() => {
        setUser(null);
        client.removeQueries({ queryKey: queryKeys.auth.me() });
      })
      .finally(() => hydrate());
  }, [client, hydrate, setUser]);

  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        username: user.username,
      });

      const socket = getSocket();
      if (!socket.connected) {
        socket.connect();
      }

      return () => {
        disconnectSocket();
      };
    }

    client.removeQueries({ queryKey: queryKeys.messages.allConversations() });
    client.removeQueries({ queryKey: queryKeys.messages.all() });
    client.removeQueries({ queryKey: queryKeys.messages.allSearch() });
    disconnectSocket();
    Sentry.setUser(null);
  }, [client, user]);

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
