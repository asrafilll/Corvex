import { Prisma, prisma } from "../../utils/prisma";
import type { CreateProjectInput, UpdateProjectInput } from "./schema";

const projectSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  deadline: true,
  budgetAmount: true,
  currency: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function findProjectOrNull(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
}

export async function listProjects({ status }: { status?: CreateProjectInput["status"] } = {}) {
  const projects = await prisma.project.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    where: status ? { status } : undefined,
    select: {
      ...projectSelect,
      customer: { select: { id: true, name: true } },
    },
  });

  return { projects: projects.map(serializeProject) };
}

export async function getProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ...projectSelect,
      customer: true,
      tasks: { orderBy: [{ order: "asc" }, { id: "asc" }] },
      milestones: { orderBy: [{ date: "asc" }, { id: "asc" }] },
      payments: { orderBy: [{ date: "desc" }, { id: "desc" }] },
      notes: { orderBy: [{ updatedAt: "desc" }, { id: "desc" }] },
      secrets: {
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: { id: true, name: true, description: true },
      },
      mcpTokens: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true, name: true, createdAt: true, lastUsedAt: true, revoked: true },
      },
    },
  });

  if (!project) {
    return null;
  }

  return serializeProjectDetail(project);
}

export async function createProject(input: CreateProjectInput) {
  return {
    project: serializeProject(
      await prisma.project.create({
        data: createProjectData(input),
        select: {
          ...projectSelect,
          customer: { select: { id: true, name: true } },
        },
      }),
    ),
  };
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  return {
    project: serializeProject(
      await prisma.project.update({
        where: { id: projectId },
        data: updateProjectData(input),
        select: {
          ...projectSelect,
          customer: { select: { id: true, name: true } },
        },
      }),
    ),
  };
}

export async function deleteProject(projectId: string) {
  await prisma.project.delete({ where: { id: projectId } });

  return { ok: true };
}

function createProjectData(input: CreateProjectInput): Prisma.ProjectCreateInput {
  const { budgetAmount, customerId, ...data } = input;

  return {
    ...data,
    budgetAmount: projectBudgetAmount(budgetAmount),
    customer: customerId ? { connect: { id: customerId } } : undefined,
  };
}

function updateProjectData(input: UpdateProjectInput): Prisma.ProjectUpdateInput {
  const { budgetAmount, customerId, ...data } = input;

  return {
    ...data,
    budgetAmount: projectBudgetAmount(budgetAmount),
    customer:
      customerId === undefined
        ? undefined
        : customerId
          ? { connect: { id: customerId } }
          : { disconnect: true },
  };
}

function projectBudgetAmount(input: CreateProjectInput["budgetAmount"]) {
  return input === undefined || input === null ? input : new Prisma.Decimal(input);
}

function serializeProject<T extends { budgetAmount: Prisma.Decimal | null }>(project: T) {
  return {
    ...project,
    budgetAmount: project.budgetAmount?.toString() ?? null,
  };
}

function serializeProjectDetail<
  T extends {
    budgetAmount: Prisma.Decimal | null;
    payments: { amount: Prisma.Decimal }[];
  },
>(project: T) {
  const paidTotal = project.payments.reduce(
    (total, payment) => total.plus(payment.amount),
    new Prisma.Decimal(0),
  );
  const outstanding = project.budgetAmount ? project.budgetAmount.minus(paidTotal) : null;

  return {
    ...serializeProject(project),
    payments: project.payments.map((payment) => ({
      ...payment,
      amount: payment.amount.toString(),
    })),
    paidTotal: paidTotal.toString(),
    outstanding: outstanding?.toString() ?? null,
  };
}
