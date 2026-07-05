import { z } from "zod";

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable().optional(),
);

export const customerParamSchema = z.object({
  customerId: z.string().trim().min(1),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: optionalTextSchema,
  phone: optionalTextSchema,
  company: optionalTextSchema,
  notes: optionalTextSchema,
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required.",
  });

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
