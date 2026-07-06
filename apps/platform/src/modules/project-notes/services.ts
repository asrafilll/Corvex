import type { InferRequestType } from "@repo/api-client";
import { apiClient } from "../../lib/api";

const notesClient = apiClient.projects[":projectId"].notes;

export type CreateNoteInput = InferRequestType<typeof notesClient.$post>["json"];
export type UpdateNoteInput = InferRequestType<(typeof notesClient)[":noteId"]["$patch"]>["json"];

export async function createNote(projectId: string, input: CreateNoteInput) {
  const response = await notesClient.$post({ param: { projectId }, json: input });

  if (!response.ok) {
    throw new Error("Failed to create the note.");
  }

  return (await response.json()).note;
}

export async function updateNote(projectId: string, noteId: string, input: UpdateNoteInput) {
  const response = await notesClient[":noteId"].$patch({
    param: { projectId, noteId },
    json: input,
  });

  if (!response.ok) {
    throw new Error("Failed to update the note.");
  }

  return (await response.json()).note;
}

export async function deleteNote(projectId: string, noteId: string) {
  const response = await notesClient[":noteId"].$delete({ param: { projectId, noteId } });

  if (!response.ok) {
    throw new Error("Failed to delete the note.");
  }

  return response.json();
}
