import { z } from "zod";

export const noteParamSchema = z.object({
  projectId: z.string().trim().min(1),
  noteId: z.string().trim().min(1),
});

export const projectNotesParamSchema = noteParamSchema.pick({ projectId: true });

export const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1),
});

export const updateNoteSchema = createNoteSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required.",
  });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
