import { z } from "zod";

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable().optional(),
);

export const secretParamSchema = z.object({
  projectId: z.string().trim().min(1),
  secretId: z.string().trim().min(1),
});

export const projectSecretsParamSchema = secretParamSchema.pick({ projectId: true });

export const createSecretSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalTextSchema,
  value: z.string().min(1),
});

export const updateSecretSchema = createSecretSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required.",
  });

export type CreateSecretInput = z.infer<typeof createSecretSchema>;
export type UpdateSecretInput = z.infer<typeof updateSecretSchema>;
