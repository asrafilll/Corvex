import { prisma } from "../../utils/prisma";
import type { ActivityActor } from "../activities/services";
import { withProjectActivity } from "../activities/services";
import type { CreateNoteInput, UpdateNoteInput } from "./schema";

export async function listNotes(projectId: string) {
  return {
    notes: await prisma.note.findMany({
      where: { projectId },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    }),
  };
}

export async function findNoteOrNull(projectId: string, noteId: string) {
  return prisma.note.findFirst({
    where: { id: noteId, projectId },
    select: { id: true },
  });
}

export async function createNote(projectId: string, input: CreateNoteInput, actor: ActivityActor) {
  return withProjectActivity(
    actor,
    async (transaction) => ({
      note: await transaction.note.create({ data: { ...input, projectId } }),
    }),
    ({ note }) => ({
      action: "Created",
      entityId: note.id,
      entityLabel: note.title,
      entityType: "Note",
      projectId,
    }),
  );
}

export async function updateNote(
  projectId: string,
  noteId: string,
  input: UpdateNoteInput,
  actor: ActivityActor,
) {
  return withProjectActivity(
    actor,
    async (transaction) => ({
      note: await transaction.note.update({ where: { id: noteId }, data: input }),
    }),
    ({ note }) => ({
      action: "Updated",
      entityId: note.id,
      entityLabel: note.title,
      entityType: "Note",
      projectId,
    }),
  );
}

export async function deleteNote(projectId: string, noteId: string, actor: ActivityActor) {
  await withProjectActivity(
    actor,
    (transaction) => transaction.note.delete({ where: { id: noteId } }),
    (note) => ({
      action: "Deleted",
      entityId: note.id,
      entityLabel: note.title,
      entityType: "Note",
      projectId,
    }),
  );

  return { ok: true };
}
