import { useMutation } from "@tanstack/react-query";
import { useInvalidateProjects } from "../../projects/hooks/use-projects";
import {
  type CreateTaskInput,
  createTask,
  deleteTask,
  reorderTasks,
  type UpdateTaskInput,
  updateTask,
} from "../services";

export function useCreateTaskMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(projectId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateTaskMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      updateTask(projectId, taskId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTaskMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(projectId, taskId),
    onSuccess: invalidate,
  });
}

export function useReorderTasksMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (taskIds: string[]) => reorderTasks(projectId, taskIds),
    onSuccess: invalidate,
  });
}
