import { z } from "zod";

export const projectActivitiesParamSchema = z.object({
  projectId: z.string().trim().min(1),
});

export const activitiesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
