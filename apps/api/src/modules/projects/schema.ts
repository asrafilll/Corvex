import { z } from "zod";

export const projectStatusValues = ["Lead", "Active", "OnHold", "Completed", "Cancelled"] as const;

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable().optional(),
);
const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/)
  .nullable()
  .optional();

export const projectParamSchema = z.object({
  projectId: z.string().trim().min(1),
});

export const projectsQuerySchema = z.object({
  status: z.enum(projectStatusValues).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalTextSchema,
  status: z.enum(projectStatusValues).optional(),
  startDate: z.coerce.date().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  budgetAmount: moneySchema,
  currency: z.string().trim().min(1).max(10).optional(),
  customerId: optionalTextSchema,
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required.",
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
