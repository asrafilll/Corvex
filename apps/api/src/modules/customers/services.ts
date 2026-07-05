import { prisma } from "../../utils/prisma";
import type { CreateCustomerInput, UpdateCustomerInput } from "./schema";

const customerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  company: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listCustomers() {
  const customers = await prisma.customer.findMany({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      ...customerSelect,
      _count: { select: { projects: true } },
    },
  });

  return {
    customers: customers.map(({ _count, ...customer }) => ({
      ...customer,
      projectCount: _count.projects,
    })),
  };
}

export async function getCustomer(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      ...customerSelect,
      _count: { select: { projects: true } },
      projects: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          name: true,
          status: true,
          deadline: true,
          budgetAmount: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!customer) {
    return null;
  }

  const { _count, projects, ...details } = customer;

  return {
    ...details,
    projectCount: _count.projects,
    projects: projects.map((project) => ({
      ...project,
      budgetAmount: project.budgetAmount?.toString() ?? null,
    })),
  };
}

export async function createCustomer(input: CreateCustomerInput) {
  return {
    customer: await prisma.customer.create({
      data: input,
      select: customerSelect,
    }),
  };
}

export async function updateCustomer(customerId: string, input: UpdateCustomerInput) {
  return {
    customer: await prisma.customer.update({
      where: { id: customerId },
      data: input,
      select: customerSelect,
    }),
  };
}

export async function deleteCustomer(customerId: string) {
  await prisma.customer.delete({ where: { id: customerId } });

  return { ok: true };
}
