import { prisma } from "../../utils/prisma";

const resultLimit = 6;

export async function searchWorkspace(query: string) {
  const contains = { contains: query, mode: "insensitive" as const };
  const [projects, customers, tasks, notes] = await Promise.all([
    prisma.project.findMany({
      where: { name: contains },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: resultLimit,
      select: { id: true, name: true, status: true },
    }),
    prisma.customer.findMany({
      where: { OR: [{ name: contains }, { company: contains }] },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: resultLimit,
      select: { id: true, name: true, company: true },
    }),
    prisma.task.findMany({
      where: { OR: [{ title: contains }, { description: contains }] },
      orderBy: [{ project: { updatedAt: "desc" } }, { order: "asc" }, { id: "asc" }],
      take: resultLimit,
      select: {
        id: true,
        title: true,
        status: true,
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.note.findMany({
      where: { OR: [{ title: contains }, { body: contains }] },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: resultLimit,
      select: {
        id: true,
        title: true,
        project: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    results: [
      ...projects.map((project) => ({
        kind: "Project" as const,
        id: project.id,
        label: project.name,
        context: project.status,
      })),
      ...customers.map((customer) => ({
        kind: "Customer" as const,
        id: customer.id,
        label: customer.name,
        context: customer.company,
      })),
      ...tasks.map((task) => ({
        kind: "Task" as const,
        id: task.id,
        label: task.title,
        context: task.project.name,
        projectId: task.project.id,
      })),
      ...notes.map((note) => ({
        kind: "Note" as const,
        id: note.id,
        label: note.title,
        context: note.project.name,
        projectId: note.project.id,
      })),
    ],
  };
}
