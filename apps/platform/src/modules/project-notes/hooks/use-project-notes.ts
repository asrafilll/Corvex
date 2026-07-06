import { useMutation } from "@tanstack/react-query";
import { useInvalidateProjects } from "../../projects/hooks/use-projects";
import {
  type CreateNoteInput,
  createNote,
  deleteNote,
  type UpdateNoteInput,
  updateNote,
} from "../services";

export function useCreateNoteMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(projectId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateNoteMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: ({ noteId, input }: { noteId: string; input: UpdateNoteInput }) =>
      updateNote(projectId, noteId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteNoteMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (noteId: string) => deleteNote(projectId, noteId),
    onSuccess: invalidate,
  });
}
