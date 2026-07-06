import { useMutation } from "@tanstack/react-query";
import { useInvalidateProjects } from "../../projects/hooks/use-projects";
import {
  type CreateMilestoneInput,
  createMilestone,
  type UpdateMilestoneInput,
  updateMilestone,
} from "../services";

export function useCreateMilestoneMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (input: CreateMilestoneInput) => createMilestone(projectId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateMilestoneMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: ({ milestoneId, input }: { milestoneId: string; input: UpdateMilestoneInput }) =>
      updateMilestone(projectId, milestoneId, input),
    onSuccess: invalidate,
  });
}
