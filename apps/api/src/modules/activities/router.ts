import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AppAuthVariables, requireAppSession } from "../auth/middleware";
import { findProjectOrNull } from "../projects/services";
import { activitiesQuerySchema, projectActivitiesParamSchema } from "./schema";
import { listActivities } from "./services";

export const activitiesRouter = new Hono<{ Variables: AppAuthVariables }>().get(
  "/",
  zValidator("param", projectActivitiesParamSchema),
  zValidator("query", activitiesQuerySchema),
  async (c) => {
    if (!requireAppSession(c)) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId } = c.req.valid("param");

    if (!(await findProjectOrNull(projectId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await listActivities(projectId, c.req.valid("query").limit), 200);
  },
);
