import { apiClient } from "../../lib/api";

const activitiesClient = apiClient.projects[":projectId"].activities;

export async function listActivities(projectId: string) {
  const response = await activitiesClient.$get({
    param: { projectId },
    query: { limit: "50" },
  });

  if (!response.ok) {
    throw new Error("Failed to load project activity.");
  }

  return (await response.json()).activities;
}

export type ProjectActivity = Awaited<ReturnType<typeof listActivities>>[number];
