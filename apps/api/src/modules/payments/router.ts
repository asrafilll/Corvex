import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AuthVariables, requireUser } from "../auth/middleware";
import { findProjectOrNull } from "../projects/services";
import {
  createPaymentSchema,
  paymentParamSchema,
  projectPaymentsParamSchema,
  updatePaymentSchema,
} from "./schema";
import {
  createPayment,
  deletePayment,
  findPaymentOrNull,
  listPayments,
  updatePayment,
} from "./services";

export const paymentsRouter = new Hono<{ Variables: AuthVariables }>()
  .get("/", zValidator("param", projectPaymentsParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId } = c.req.valid("param");

    if (!(await findProjectOrNull(projectId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await listPayments(projectId), 200);
  })
  .post(
    "/",
    zValidator("param", projectPaymentsParamSchema),
    zValidator("json", createPaymentSchema),
    async (c) => {
      const user = requireUser(c);

      if (!user) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId } = c.req.valid("param");

      if (!(await findProjectOrNull(projectId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await createPayment(projectId, c.req.valid("json")), 201);
    },
  )
  .patch(
    "/:paymentId",
    zValidator("param", paymentParamSchema),
    zValidator("json", updatePaymentSchema),
    async (c) => {
      const user = requireUser(c);

      if (!user) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId, paymentId } = c.req.valid("param");

      if (!(await findPaymentOrNull(projectId, paymentId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await updatePayment(paymentId, c.req.valid("json")), 200);
    },
  )
  .delete("/:paymentId", zValidator("param", paymentParamSchema), async (c) => {
    const user = requireUser(c);

    if (!user) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId, paymentId } = c.req.valid("param");

    if (!(await findPaymentOrNull(projectId, paymentId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await deletePayment(paymentId), 200);
  });
