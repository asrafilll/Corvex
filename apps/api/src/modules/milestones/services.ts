import { prisma } from "../../utils/prisma";
import type { ActivityActor } from "../activities/services";
import { withProjectActivity } from "../activities/services";
import type { CreateMilestoneInput, UpdateMilestoneInput } from "./schema";

export async function listMilestones(projectId: string) {
  return {
    milestones: await prisma.milestone.findMany({
      where: { projectId },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    }),
  };
}

export async function findMilestoneOrNull(projectId: string, milestoneId: string) {
  return prisma.milestone.findFirst({
    where: { id: milestoneId, projectId },
    select: { id: true },
  });
}

export async function createMilestone(
  projectId: string,
  input: CreateMilestoneInput,
  actor: ActivityActor,
) {
  return withProjectActivity(
    actor,
    async (transaction) => ({
      milestone: await transaction.milestone.create({ data: { ...input, projectId } }),
    }),
    ({ milestone }) => ({
      action: "Created",
      entityId: milestone.id,
      entityLabel: milestone.name,
      entityType: "Milestone",
      projectId,
    }),
  );
}

export async function updateMilestone(
  projectId: string,
  milestoneId: string,
  input: UpdateMilestoneInput,
  actor: ActivityActor,
) {
  return withProjectActivity(
    actor,
    async (transaction) => ({
      milestone: await transaction.milestone.update({
        where: { id: milestoneId },
        data: input,
      }),
    }),
    ({ milestone }) => ({
      action: "Updated",
      entityId: milestone.id,
      entityLabel: milestone.name,
      entityType: "Milestone",
      projectId,
    }),
  );
}

export async function deleteMilestone(
  projectId: string,
  milestoneId: string,
  actor: ActivityActor,
) {
  await withProjectActivity(
    actor,
    (transaction) => transaction.milestone.delete({ where: { id: milestoneId } }),
    (milestone) => ({
      action: "Deleted",
      entityId: milestone.id,
      entityLabel: milestone.name,
      entityType: "Milestone",
      projectId,
    }),
  );

  return { ok: true };
}
