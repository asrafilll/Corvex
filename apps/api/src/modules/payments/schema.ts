import { z } from "zod";

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable().optional(),
);
const amountSchema = z.preprocess(
  (value) => (typeof value === "number" ? value.toString() : value),
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/),
);

export const paymentParamSchema = z.object({
  projectId: z.string().trim().min(1),
  paymentId: z.string().trim().min(1),
});

export const projectPaymentsParamSchema = paymentParamSchema.pick({ projectId: true });

export const createPaymentSchema = z.object({
  date: z.coerce.date(),
  amount: amountSchema,
  note: optionalTextSchema,
});

export const updatePaymentSchema = createPaymentSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required.",
  });

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
