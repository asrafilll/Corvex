import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AuthVariables, requireUser } from "../auth/middleware";
import { findProjectOrNull } from "../projects/services";
import {
  createTaskSchema,
  projectTasksParamSchema,
  reorderTasksSchema,
  taskParamSchema,
  updateTaskSchema,
} from "./schema";
import {
  createTask,
  deleteTask,
  findTaskOrNull,
  InvalidTaskReorderError,
  listTasks,
  reorderTasks,
  updateTask,
} from "./services";

export const tasksRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", zValidator("param", projectTasksParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId } = c.req.valid("param");

    if (!(await findProjectOrNull(projectId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await listTasks(projectId), 200);
  })
  .post(
    "/",
    zValidator("param", projectTasksParamSchema),
    zValidator("json", createTaskSchema),
    async (c) => {
      const user = requireUser(c);

      if (!user) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId } = c.req.valid("param");

      if (!(await findProjectOrNull(projectId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await createTask(projectId, c.req.valid("json")), 201);
    },
  )
  .post(
    "/reorder",
    zValidator("param", projectTasksParamSchema),
    zValidator("json", reorderTasksSchema),
    async (c) => {
      const user = requireUser(c);

      if (!user) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId } = c.req.valid("param");

      if (!(await findProjectOrNull(projectId))) {
        return c.json({ error: "not_found" }, 404);
      }

      try {
        return c.json(await reorderTasks(projectId, c.req.valid("json").taskIds), 200);
      } catch (error) {
        if (error instanceof InvalidTaskReorderError) {
          return c.json({ error: "invalid_task_order" }, 400);
        }

        throw error;
      }
    },
  )
  .patch(
    "/:taskId",
    zValidator("param", taskParamSchema),
    zValidator("json", updateTaskSchema),
    async (c) => {
      const user = requireUser(c);

      if (!user) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId, taskId } = c.req.valid("param");

      if (!(await findTaskOrNull(projectId, taskId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await updateTask(taskId, c.req.valid("json")), 200);
    },
  )
  .delete("/:taskId", zValidator("param", taskParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId, taskId } = c.req.valid("param");

    if (!(await findTaskOrNull(projectId, taskId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await deleteTask(taskId), 200);
  });
