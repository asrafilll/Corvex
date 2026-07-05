import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AuthVariables, requireUser } from "../auth/middleware";
import {
  createProjectSchema,
  projectParamSchema,
  projectsQuerySchema,
  updateProjectSchema,
} from "./schema";
import {
  createProject,
  deleteProject,
  findProjectOrNull,
  getProject,
  listProjects,
  updateProject,
} from "./services";
import { tasksRouter } from "../tasks/router";

export const projectsRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", zValidator("query", projectsQuerySchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    return c.json(await listProjects(c.req.valid("query")), 200);
  })
  .post("/", zValidator("json", createProjectSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    return c.json(await createProject(c.req.valid("json")), 201);
  })
  .route("/:projectId/tasks", tasksRouter)
  .get("/:projectId", zValidator("param", projectParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const project = await getProject(c.req.valid("param").projectId);

    if (!project) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json({ project }, 200);
  })
  .patch(
    "/:projectId",
    zValidator("param", projectParamSchema),
    zValidator("json", updateProjectSchema),
    async (c) => {
      const user = requireUser(c);

      if (!user) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const projectId = c.req.valid("param").projectId;

      if (!(await findProjectOrNull(projectId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await updateProject(projectId, c.req.valid("json")), 200);
    },
  )
  .delete("/:projectId", zValidator("param", projectParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const projectId = c.req.valid("param").projectId;

    if (!(await findProjectOrNull(projectId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await deleteProject(projectId), 200);
  });
