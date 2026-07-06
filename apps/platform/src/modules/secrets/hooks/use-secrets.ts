import { useMutation } from "@tanstack/react-query";
import { useInvalidateProjects } from "../../projects/hooks/use-projects";
import { type CreateSecretInput, createSecret, deleteSecret, revealSecret } from "../services";

export function useCreateSecretMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (input: CreateSecretInput) => createSecret(projectId, input),
    onSuccess: invalidate,
  });
}

export function useRevealSecretMutation(projectId: string) {
  return useMutation({
    mutationFn: (secretId: string) => revealSecret(projectId, secretId),
  });
}

export function useDeleteSecretMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (secretId: string) => deleteSecret(projectId, secretId),
    onSuccess: invalidate,
  });
}
