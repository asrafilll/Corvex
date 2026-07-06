import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  type ProjectStatus,
  type UpdateProjectInput,
  updateProject,
} from "../services";

export const projectsQueryKey = ["projects"] as const;

// Invalidating the root key refreshes both the list and every ["projects", projectId] detail.
export function useInvalidateProjects() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
  };
}

export function projectsQueryOptions(status?: ProjectStatus) {
  return queryOptions({
    queryKey: [...projectsQueryKey, "list", status ?? "all"],
    queryFn: () => listProjects(status),
  });
}

export function projectQueryOptions(projectId: string) {
  return queryOptions({
    queryKey: [...projectsQueryKey, projectId],
    queryFn: () => getProject(projectId),
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
}

export function useUpdateProjectMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => updateProject(projectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
}
