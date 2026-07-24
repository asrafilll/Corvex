import { apiConfig } from "@repo/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { type AppAuthVariables, loadAppSession } from "./modules/auth/middleware";
import { appAuthRouter } from "./modules/auth/router";
import { customersRouter } from "./modules/customers/router";
import { mcpRouter } from "./modules/mcp/router";
import { projectsRouter } from "./modules/projects/router";
import { searchRouter } from "./modules/search/router";

export const app = new Hono<{ Variables: AppAuthVariables }>()
  .use(
    "*",
    cors({
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      origin: (origin) => (apiConfig.clientOrigins.includes(origin) ? origin : null),
    }),
  )
  .use("*", loadAppSession)
  .get("/health", (c) => {
    return c.json({ ok: true, service: "api" }, 200);
  })
  .route("/auth", appAuthRouter)
  .route("/customers", customersRouter)
  .route("/mcp", mcpRouter)
  .route("/projects", projectsRouter)
  .route("/search", searchRouter);

export type AppType = typeof app;
