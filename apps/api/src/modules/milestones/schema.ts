import { z } from "zod";

export const milestoneParamSchema = z.object({
  projectId: z.string().trim().min(1),
  milestoneId: z.string().trim().min(1),
});

export const projectMilestonesParamSchema = milestoneParamSchema.pick({ projectId: true });

export const createMilestoneSchema = z.object({
  name: z.string().trim().min(1).max(300),
  date: z.coerce.date(),
});

export const updateMilestoneSchema = createMilestoneSchema
  .extend({ done: z.boolean() })
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required.",
  });

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
