"use client";

import { useQuery } from "@tanstack/react-query";
import { currentUserQueryOptions } from "@/features/users/queries/currentUserQuery";
import { useSessionStore } from "@/stores/sessionStore";

export function useCurrentUser() {
  const authBootstrapComplete = useSessionStore(
    (state) => state.authBootstrapComplete,
  );
  const query = useQuery({
    ...currentUserQueryOptions(),
    enabled: authBootstrapComplete,
  });

  return {
    ...query,
    authBootstrapComplete,
    isAuthenticated: Boolean(query.data?.data),
    user: query.data?.data ?? null,
  };
}
