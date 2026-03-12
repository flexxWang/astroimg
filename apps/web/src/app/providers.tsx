"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useUserStore } from "@/stores/userStore";
import { fetchMe } from "@/services/userApi";

export default function Providers({ children }: { children: ReactNode }) {
  const hydrate = useUserStore((state) => state.hydrate);
  const setUser = useUserStore((state) => state.setUser);
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

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
