import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AppAuthVariables, requireAppSession } from "../auth/middleware";
import { searchQuerySchema } from "./schema";
import { searchWorkspace } from "./services";

export const searchRouter = new Hono<{ Variables: AppAuthVariables }>().get(
  "/",
  zValidator("query", searchQuerySchema),
  async (c) => {
    if (!requireAppSession(c)) {
      return c.json({ error: "unauthorized" }, 401);
    }

    return c.json(await searchWorkspace(c.req.valid("query").q), 200);
  },
);
