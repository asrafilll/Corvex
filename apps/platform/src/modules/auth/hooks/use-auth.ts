import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authQueryKey } from "../schema";
import { getAppSession, lock, unlock } from "../services";

export const appSessionQueryOptions = queryOptions({
  queryKey: [...authQueryKey, "session"],
  queryFn: getAppSession,
  retry: false,
});

export function useUnlockMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unlock,
    onSuccess: async (session) => {
      queryClient.setQueryData(appSessionQueryOptions.queryKey, session);
      await navigate({ to: "/projects" });
    },
  });
}

export function useLockMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: lock,
    onSuccess: async () => {
      queryClient.clear();
      await navigate({ to: "/login" });
    },
  });
}
