import { prisma } from "../../utils/prisma";
import type { CreateTaskInput, UpdateTaskInput } from "./schema";

export class InvalidTaskReorderError extends Error {
  constructor() {
    super("Task ids must exactly match the Project's Tasks.");
    this.name = "InvalidTaskReorderError";
  }
}

export async function listTasks(projectId: string) {
  return {
    tasks: await prisma.task.findMany({
      where: { projectId },
      orderBy: [{ order: "asc" }, { id: "asc" }],
    }),
  };
}

export async function findTaskOrNull(projectId: string, taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true },
  });
}

export async function createTask(projectId: string, input: CreateTaskInput) {
  const order =
    input.order ??
    ((await prisma.task.aggregate({ where: { projectId }, _max: { order: true } }))._max.order ??
      -1) + 1;

  return {
    task: await prisma.task.create({
      data: { ...input, projectId, order },
    }),
  };
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  return {
    task: await prisma.task.update({
      where: { id: taskId },
      data: input,
    }),
  };
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });

  return { ok: true };
}

export async function reorderTasks(projectId: string, taskIds: string[]) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { id: true },
  });
  const existingIds = tasks.map((task) => task.id).sort();
  const requestedIds = [...taskIds].sort();

  if (existingIds.join("\0") !== requestedIds.join("\0")) {
    throw new InvalidTaskReorderError();
  }

  await prisma.$transaction(
    taskIds.map((id, order) =>
      prisma.task.update({
        where: { id },
        data: { order },
      }),
    ),
  );

  return listTasks(projectId);
}
