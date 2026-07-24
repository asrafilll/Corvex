import type { InferRequestType } from "@repo/api-client";
import { apiClient } from "../../lib/api";

const tasksClient = apiClient.projects[":projectId"].tasks;

export type CreateTaskInput = InferRequestType<typeof tasksClient.$post>["json"];
export type UpdateTaskInput = InferRequestType<(typeof tasksClient)[":taskId"]["$patch"]>["json"];
export type TaskStatus = NonNullable<CreateTaskInput["status"]>;
export type TaskPriority = NonNullable<CreateTaskInput["priority"]>;

export const taskStatusValues = [
  "Todo",
  "InProgress",
  "Done",
  "Cancelled",
] as const satisfies readonly TaskStatus[];

export const taskPriorityValues = [
  "None",
  "Low",
  "Medium",
  "High",
  "Urgent",
] as const satisfies readonly TaskPriority[];

export async function createTask(projectId: string, input: CreateTaskInput) {
  const response = await tasksClient.$post({ param: { projectId }, json: input });

  if (!response.ok) {
    throw new Error("Failed to create the task.");
  }

  return (await response.json()).task;
}

export async function updateTask(projectId: string, taskId: string, input: UpdateTaskInput) {
  const response = await tasksClient[":taskId"].$patch({
    param: { projectId, taskId },
    json: input,
  });

  if (!response.ok) {
    throw new Error("Failed to update the task.");
  }

  return (await response.json()).task;
}

export async function deleteTask(projectId: string, taskId: string) {
  const response = await tasksClient[":taskId"].$delete({ param: { projectId, taskId } });

  if (!response.ok) {
    throw new Error("Failed to delete the task.");
  }

  return response.json();
}

export async function reorderTasks(projectId: string, taskIds: string[]) {
  const response = await tasksClient.reorder.$post({
    param: { projectId },
    json: { taskIds },
  });

  if (!response.ok) {
    throw new Error("Failed to reorder tasks.");
  }

  return (await response.json()).tasks;
}
