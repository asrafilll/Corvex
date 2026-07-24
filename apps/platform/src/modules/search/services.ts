import { apiClient } from "../../lib/api";

export async function searchWorkspace(query: string) {
  const response = await apiClient.search.$get({ query: { q: query } });

  if (!response.ok) {
    throw new Error("Failed to search Corvex.");
  }

  return (await response.json()).results;
}

export type WorkspaceSearchResult = Awaited<ReturnType<typeof searchWorkspace>>[number];
