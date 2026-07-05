import type { InferRequestType } from "@repo/api-client";
import { apiClient } from "../../lib/api";

export type ListProjectsQuery = InferRequestType<typeof apiClient.projects.$get>["query"];
export type ProjectStatus = NonNullable<ListProjectsQuery["status"]>;
export type CreateProjectInput = InferRequestType<typeof apiClient.projects.$post>["json"];
export type UpdateProjectInput = InferRequestType<
  (typeof apiClient.projects)[":projectId"]["$patch"]
>["json"];

export const projectStatusValues = [
  "Lead",
  "Active",
  "OnHold",
  "Completed",
  "Cancelled",
] as const satisfies readonly ProjectStatus[];

export async function listProjects(status?: ProjectStatus) {
  const response = await apiClient.projects.$get({
    query: status ? { status } : {},
  });

  if (!response.ok) {
    throw new Error("Failed to load projects.");
  }

  return (await response.json()).projects;
}

export async function getProject(projectId: string) {
  const response = await apiClient.projects[":projectId"].$get({
    param: { projectId },
  });

  if (!response.ok) {
    throw new Error("Failed to load the project.");
  }

  return (await response.json()).project;
}

export async function createProject(input: CreateProjectInput) {
  const response = await apiClient.projects.$post({ json: input });

  if (!response.ok) {
    throw new Error("Failed to create the project.");
  }

  return (await response.json()).project;
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const response = await apiClient.projects[":projectId"].$patch({
    param: { projectId },
    json: input,
  });

  if (!response.ok) {
    throw new Error("Failed to update the project.");
  }

  return (await response.json()).project;
}

export async function deleteProject(projectId: string) {
  const response = await apiClient.projects[":projectId"].$delete({
    param: { projectId },
  });

  if (!response.ok) {
    throw new Error("Failed to delete the project.");
  }

  return response.json();
}
