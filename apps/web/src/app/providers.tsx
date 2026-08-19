"use client";

import * as Sentry from "@sentry/nextjs";
import {
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { currentUserQueryOptions } from "@/features/users/queries/currentUserQuery";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { createAppQueryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { useSessionStore } from "@/stores/sessionStore";

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
  const setAuthBootstrapComplete = useSessionStore(
    (state) => state.setAuthBootstrapComplete,
  );
  const queryClient = useQueryClient();
  const userQuery = useQuery(currentUserQueryOptions());
  const user = userQuery.data?.data ?? null;

  useEffect(() => {
    if (userQuery.isFetched || userQuery.isError) {
      setAuthBootstrapComplete(true);
    }
  }, [setAuthBootstrapComplete, userQuery.isError, userQuery.isFetched]);

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

    queryClient.removeQueries({ queryKey: queryKeys.messages.all() });
    disconnectSocket();
    Sentry.setUser(null);
  }, [queryClient, user]);

  return (
    <>{children}</>
  );
}
