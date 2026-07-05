import { prisma } from "../../utils/prisma";
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

export async function createNote(projectId: string, input: CreateNoteInput) {
  return {
    note: await prisma.note.create({
      data: { ...input, projectId },
    }),
  };
}

export async function updateNote(noteId: string, input: UpdateNoteInput) {
  return {
    note: await prisma.note.update({
      where: { id: noteId },
      data: input,
    }),
  };
}

export async function deleteNote(noteId: string) {
  await prisma.note.delete({ where: { id: noteId } });

  return { ok: true };
}
