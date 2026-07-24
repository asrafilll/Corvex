import { queryOptions } from "@tanstack/react-query";
import { searchWorkspace } from "../services";

export function workspaceSearchQueryOptions(query: string) {
  return queryOptions({
    queryKey: ["search", query],
    queryFn: () => searchWorkspace(query),
    enabled: query.length > 0,
    staleTime: 30_000,
  });
}
