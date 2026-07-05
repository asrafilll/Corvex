import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AuthVariables, requireUser } from "../auth/middleware";
import { findProjectOrNull } from "../projects/services";
import {
  createSecretSchema,
  projectSecretsParamSchema,
  secretParamSchema,
  updateSecretSchema,
} from "./schema";
import {
  createSecret,
  deleteSecret,
  DuplicateSecretNameError,
  findSecretOrNull,
  listSecrets,
  revealSecret,
  updateSecret,
} from "./services";

export const secretsRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", zValidator("param", projectSecretsParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId } = c.req.valid("param");

    if (!(await findProjectOrNull(projectId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await listSecrets(projectId), 200);
  })
  .post(
    "/",
    zValidator("param", projectSecretsParamSchema),
    zValidator("json", createSecretSchema),
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
        return c.json(await createSecret(projectId, c.req.valid("json")), 201);
      } catch (error) {
        if (error instanceof DuplicateSecretNameError) {
          return c.json({ error: "duplicate_secret_name" }, 409);
        }

        throw error;
      }
    },
  )
  .post("/:secretId/reveal", zValidator("param", secretParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId, secretId } = c.req.valid("param");
    const revealed = await revealSecret(projectId, secretId);

    if (!revealed) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(revealed, 200);
  })
  .patch(
    "/:secretId",
    zValidator("param", secretParamSchema),
    zValidator("json", updateSecretSchema),
    async (c) => {
      const user = requireUser(c);

      if (!user) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId, secretId } = c.req.valid("param");

      if (!(await findSecretOrNull(projectId, secretId))) {
        return c.json({ error: "not_found" }, 404);
      }

      try {
        return c.json(await updateSecret(secretId, c.req.valid("json")), 200);
      } catch (error) {
        if (error instanceof DuplicateSecretNameError) {
          return c.json({ error: "duplicate_secret_name" }, 409);
        }

        throw error;
      }
    },
  )
  .delete("/:secretId", zValidator("param", secretParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId, secretId } = c.req.valid("param");

    if (!(await findSecretOrNull(projectId, secretId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await deleteSecret(secretId), 200);
  });
