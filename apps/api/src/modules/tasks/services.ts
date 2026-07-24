import { prisma } from "../../utils/prisma";
import type { ActivityActor } from "../activities/services";
import { withProjectActivity } from "../activities/services";
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

export async function createTask(projectId: string, input: CreateTaskInput, actor: ActivityActor) {
  return withProjectActivity(
    actor,
    async (transaction) => {
      const order =
        input.order ??
        ((
          await transaction.task.aggregate({
            where: { projectId },
            _max: { order: true },
          })
        )._max.order ?? -1) + 1;

      return {
        task: await transaction.task.create({
          data: { ...input, projectId, order },
        }),
      };
    },
    ({ task }) => ({
      action: "Created",
      entityId: task.id,
      entityLabel: task.title,
      entityType: "Task",
      projectId,
    }),
  );
}

export async function updateTask(
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
  actor: ActivityActor,
) {
  return withProjectActivity(
    actor,
    async (transaction) => ({
      task: await transaction.task.update({
        where: { id: taskId },
        data: input,
      }),
    }),
    ({ task }) => ({
      action: "Updated",
      entityId: task.id,
      entityLabel: task.title,
      entityType: "Task",
      projectId,
    }),
  );
}

export async function deleteTask(projectId: string, taskId: string, actor: ActivityActor) {
  await withProjectActivity(
    actor,
    (transaction) => transaction.task.delete({ where: { id: taskId } }),
    (task) => ({
      action: "Deleted",
      entityId: task.id,
      entityLabel: task.title,
      entityType: "Task",
      projectId,
    }),
  );

  return { ok: true };
}

export async function reorderTasks(projectId: string, taskIds: string[], actor: ActivityActor) {
  return withProjectActivity(
    actor,
    async (transaction) => {
      const tasks = await transaction.task.findMany({
        where: { projectId },
        select: { id: true },
      });
      const existingIds = tasks.map((task) => task.id).sort();
      const requestedIds = [...taskIds].sort();

      if (existingIds.join("\0") !== requestedIds.join("\0")) {
        throw new InvalidTaskReorderError();
      }

      await Promise.all(
        taskIds.map((id, order) =>
          transaction.task.update({
            where: { id },
            data: { order },
          }),
        ),
      );

      return {
        tasks: await transaction.task.findMany({
          where: { projectId },
          orderBy: [{ order: "asc" }, { id: "asc" }],
        }),
      };
    },
    () => ({
      action: "Reordered",
      entityLabel: "Tasks",
      entityType: "Task",
      projectId,
    }),
  );
}
