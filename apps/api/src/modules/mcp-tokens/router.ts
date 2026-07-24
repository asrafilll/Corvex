import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { appActivityActor } from "../activities/services";
import { type AppAuthVariables, requireAppSession } from "../auth/middleware";
import { findProjectOrNull } from "../projects/services";
import { createMcpTokenSchema, mcpTokenParamSchema, projectMcpTokensParamSchema } from "./schema";
import { createMcpToken, findMcpTokenOrNull, listMcpTokens, revokeMcpToken } from "./services";

export const mcpTokensRouter = new Hono<{ Variables: AppAuthVariables }>()
  .get("/", zValidator("param", projectMcpTokensParamSchema), async (c) => {
    const hasSession = requireAppSession(c);

    if (!hasSession) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId } = c.req.valid("param");

    if (!(await findProjectOrNull(projectId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await listMcpTokens(projectId), 200);
  })
  .post(
    "/",
    zValidator("param", projectMcpTokensParamSchema),
    zValidator("json", createMcpTokenSchema),
    async (c) => {
      const hasSession = requireAppSession(c);

      if (!hasSession) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId } = c.req.valid("param");

      if (!(await findProjectOrNull(projectId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await createMcpToken(projectId, c.req.valid("json"), appActivityActor), 201);
    },
  )
  .post("/:tokenId/revoke", zValidator("param", mcpTokenParamSchema), async (c) => {
    const hasSession = requireAppSession(c);

    if (!hasSession) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId, tokenId } = c.req.valid("param");

    if (!(await findMcpTokenOrNull(projectId, tokenId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await revokeMcpToken(projectId, tokenId, appActivityActor), 200);
  });
