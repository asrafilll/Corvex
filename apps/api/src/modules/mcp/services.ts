import { type TaskStatus, prisma } from "../../utils/prisma";

// ADR-0002: get_project deliberately omits budget, currency, and payments —
// money never crosses the MCP boundary.
export async function getMcpProject(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      deadline: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { id: true, name: true } },
      milestones: {
        orderBy: [{ date: "asc" }, { id: "asc" }],
        select: { id: true, name: true, date: true, done: true },
      },
    },
  });
}

export async function listMcpTasks(projectId: string, status?: TaskStatus) {
  return prisma.task.findMany({
    where: { projectId, ...(status ? { status } : {}) },
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });
}

export async function getMcpTask(projectId: string, taskId: string) {
  return prisma.task.findFirst({ where: { id: taskId, projectId } });
}

export async function getMcpNote(projectId: string, noteId: string) {
  return prisma.note.findFirst({ where: { id: noteId, projectId } });
}

export async function listMcpMilestones(projectId: string) {
  return prisma.milestone.findMany({
    where: { projectId },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });
}
