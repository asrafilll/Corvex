import { z } from "zod";

export const taskStatusValues = ["Todo", "InProgress", "Done", "Cancelled"] as const;
export const taskPriorityValues = ["None", "Low", "Medium", "High", "Urgent"] as const;

const optionalTextSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().nullable().optional(),
);

export const taskParamSchema = z.object({
  projectId: z.string().trim().min(1),
  taskId: z.string().trim().min(1),
});

export const projectTasksParamSchema = taskParamSchema.pick({ projectId: true });

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: optionalTextSchema,
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required.",
  });

export const reorderTasksSchema = z.object({
  taskIds: z.array(z.string().trim().min(1)).min(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
