"use client";

import * as Sentry from "@sentry/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useUserStore } from "@/stores/userStore";
import { fetchMe } from "@/services/userApi";

export default function Providers({ children }: { children: ReactNode }) {
  const hydrate = useUserStore((state) => state.hydrate);
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);
  const [client] = useState(() =>
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          refetchOnWindowFocus: false,
        },
      },
    }),
  );

  useEffect(() => {
    fetchMe()
      .then((result) => setUser(result.data))
      .catch(() => setUser(null))
      .finally(() => hydrate());
  }, [hydrate, setUser]);

  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        username: user.username,
      });
      return;
    }

    Sentry.setUser(null);
  }, [user]);

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
