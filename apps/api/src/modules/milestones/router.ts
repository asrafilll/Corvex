import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { appActivityActor } from "../activities/services";
import { type AppAuthVariables, requireAppSession } from "../auth/middleware";
import { findProjectOrNull } from "../projects/services";
import {
  createMilestoneSchema,
  milestoneParamSchema,
  projectMilestonesParamSchema,
  updateMilestoneSchema,
} from "./schema";
import {
  createMilestone,
  deleteMilestone,
  findMilestoneOrNull,
  listMilestones,
  updateMilestone,
} from "./services";

export const milestonesRouter = new Hono<{ Variables: AppAuthVariables }>()
  .get("/", zValidator("param", projectMilestonesParamSchema), async (c) => {
    const hasSession = requireAppSession(c);

    if (!hasSession) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId } = c.req.valid("param");

    if (!(await findProjectOrNull(projectId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await listMilestones(projectId), 200);
  })
  .post(
    "/",
    zValidator("param", projectMilestonesParamSchema),
    zValidator("json", createMilestoneSchema),
    async (c) => {
      const hasSession = requireAppSession(c);

      if (!hasSession) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId } = c.req.valid("param");

      if (!(await findProjectOrNull(projectId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await createMilestone(projectId, c.req.valid("json"), appActivityActor), 201);
    },
  )
  .patch(
    "/:milestoneId",
    zValidator("param", milestoneParamSchema),
    zValidator("json", updateMilestoneSchema),
    async (c) => {
      const hasSession = requireAppSession(c);

      if (!hasSession) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId, milestoneId } = c.req.valid("param");

      if (!(await findMilestoneOrNull(projectId, milestoneId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(
        await updateMilestone(projectId, milestoneId, c.req.valid("json"), appActivityActor),
        200,
      );
    },
  )
  .delete("/:milestoneId", zValidator("param", milestoneParamSchema), async (c) => {
    const hasSession = requireAppSession(c);

    if (!hasSession) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId, milestoneId } = c.req.valid("param");

    if (!(await findMilestoneOrNull(projectId, milestoneId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await deleteMilestone(projectId, milestoneId, appActivityActor), 200);
  });
