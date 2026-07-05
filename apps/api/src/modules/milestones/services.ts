import { prisma } from "../../utils/prisma";
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

export async function createMilestone(projectId: string, input: CreateMilestoneInput) {
  return {
    milestone: await prisma.milestone.create({
      data: { ...input, projectId },
    }),
  };
}

export async function updateMilestone(milestoneId: string, input: UpdateMilestoneInput) {
  return {
    milestone: await prisma.milestone.update({
      where: { id: milestoneId },
      data: input,
    }),
  };
}

export async function deleteMilestone(milestoneId: string) {
  await prisma.milestone.delete({ where: { id: milestoneId } });

  return { ok: true };
}
