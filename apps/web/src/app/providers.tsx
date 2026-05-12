"use client";

import * as Sentry from "@sentry/nextjs";
import {
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useUserStore } from "@/stores/userStore";
import { fetchMe } from "@/features/users/services/userApi";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { createAppQueryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(createAppQueryClient);

  return (
    <QueryClientProvider client={client}>
      <AppBootstrap>{children}</AppBootstrap>
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}

function AppBootstrap({ children }: { children: ReactNode }) {
  const setHydrated = useUserStore((state) => state.setHydrated);
  const queryClient = useQueryClient();
  const userQuery = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => fetchMe({ errorToast: false, suppressUnauthorized: true }),
    retry: false,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const user = userQuery.data?.data ?? null;

  useEffect(() => {
    if (userQuery.isFetched || userQuery.isError) {
      setHydrated(true);
    }
  }, [setHydrated, userQuery.isError, userQuery.isFetched]);

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

    queryClient.removeQueries({ queryKey: queryKeys.messages.allConversations() });
    queryClient.removeQueries({ queryKey: queryKeys.messages.all() });
    queryClient.removeQueries({ queryKey: queryKeys.messages.allSearch() });
    disconnectSocket();
    Sentry.setUser(null);
  }, [queryClient, user]);

  return (
    <>{children}</>
  );
}
