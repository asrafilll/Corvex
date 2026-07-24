import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { type AppAuthVariables, requireAppSession } from "../auth/middleware";
import { createCustomerSchema, customerParamSchema, updateCustomerSchema } from "./schema";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "./services";

export const customersRouter = new Hono<{ Variables: AppAuthVariables }>()
  .get("/", async (c) => {
    const hasSession = requireAppSession(c);

    if (!hasSession) {
      return c.json({ error: "unauthorized" }, 401);
    }

    return c.json(await listCustomers(), 200);
  })
  .post("/", zValidator("json", createCustomerSchema), async (c) => {
    const hasSession = requireAppSession(c);

    if (!hasSession) {
      return c.json({ error: "unauthorized" }, 401);
    }

    return c.json(await createCustomer(c.req.valid("json")), 201);
  })
  .get("/:customerId", zValidator("param", customerParamSchema), async (c) => {
    const hasSession = requireAppSession(c);

    if (!hasSession) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const customer = await getCustomer(c.req.valid("param").customerId);

    if (!customer) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json({ customer }, 200);
  })
  .patch(
    "/:customerId",
    zValidator("param", customerParamSchema),
    zValidator("json", updateCustomerSchema),
    async (c) => {
      const hasSession = requireAppSession(c);

      if (!hasSession) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const customerId = c.req.valid("param").customerId;

      if (!(await getCustomer(customerId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await updateCustomer(customerId, c.req.valid("json")), 200);
    },
  )
  .delete("/:customerId", zValidator("param", customerParamSchema), async (c) => {
    const hasSession = requireAppSession(c);

    if (!hasSession) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const customerId = c.req.valid("param").customerId;

    if (!(await getCustomer(customerId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await deleteCustomer(customerId), 200);
  });
