import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AuthVariables, requireUser } from "../auth/middleware";
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

export const milestonesRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", zValidator("param", projectMilestonesParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
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
      const user = requireUser(c);

      if (!user) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId } = c.req.valid("param");

      if (!(await findProjectOrNull(projectId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await createMilestone(projectId, c.req.valid("json")), 201);
    },
  )
  .patch(
    "/:milestoneId",
    zValidator("param", milestoneParamSchema),
    zValidator("json", updateMilestoneSchema),
    async (c) => {
      const user = requireUser(c);

      if (!user) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId, milestoneId } = c.req.valid("param");

      if (!(await findMilestoneOrNull(projectId, milestoneId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await updateMilestone(milestoneId, c.req.valid("json")), 200);
    },
  )
  .delete("/:milestoneId", zValidator("param", milestoneParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId, milestoneId } = c.req.valid("param");

    if (!(await findMilestoneOrNull(projectId, milestoneId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await deleteMilestone(milestoneId), 200);
  });
