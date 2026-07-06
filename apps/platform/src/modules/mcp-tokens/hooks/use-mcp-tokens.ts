import { useMutation } from "@tanstack/react-query";
import { useInvalidateProjects } from "../../projects/hooks/use-projects";
import { type CreateMcpTokenInput, createMcpToken, revokeMcpToken } from "../services";

export function useCreateMcpTokenMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (input: CreateMcpTokenInput) => createMcpToken(projectId, input),
    onSuccess: invalidate,
  });
}

export function useRevokeMcpTokenMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (tokenId: string) => revokeMcpToken(projectId, tokenId),
    onSuccess: invalidate,
  });
}
