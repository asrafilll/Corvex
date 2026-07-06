import type { InferRequestType } from "@repo/api-client";
import { apiClient } from "../../lib/api";

const milestonesClient = apiClient.projects[":projectId"].milestones;

export type CreateMilestoneInput = InferRequestType<typeof milestonesClient.$post>["json"];
export type UpdateMilestoneInput = InferRequestType<
  (typeof milestonesClient)[":milestoneId"]["$patch"]
>["json"];

export async function createMilestone(projectId: string, input: CreateMilestoneInput) {
  const response = await milestonesClient.$post({ param: { projectId }, json: input });

  if (!response.ok) {
    throw new Error("Failed to create the milestone.");
  }

  return (await response.json()).milestone;
}

export async function updateMilestone(
  projectId: string,
  milestoneId: string,
  input: UpdateMilestoneInput,
) {
  const response = await milestonesClient[":milestoneId"].$patch({
    param: { projectId, milestoneId },
    json: input,
  });

  if (!response.ok) {
    throw new Error("Failed to update the milestone.");
  }

  return (await response.json()).milestone;
}
