import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app";
import { createTransactionMock } from "./test/helpers";

const mocks = vi.hoisted(() => ({
  customerCreate: vi.fn(),
  customerDelete: vi.fn(),
  customerFindMany: vi.fn(),
  customerFindUnique: vi.fn(),
  customerUpdate: vi.fn(),
  readAppSession: vi.fn(),
  projectCreate: vi.fn(),
  projectDelete: vi.fn(),
  projectFindMany: vi.fn(),
  projectFindUnique: vi.fn(),
  projectUpdate: vi.fn(),
  taskCreate: vi.fn(),
  taskDelete: vi.fn(),
  taskAggregate: vi.fn(),
  taskFindFirst: vi.fn(),
  taskFindMany: vi.fn(),
  taskUpdate: vi.fn(),
  activityCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("./modules/auth/auth", () => ({
  readAppSession: mocks.readAppSession,
}));

vi.mock("./utils/prisma", () => ({
  Prisma,
  prisma: {
    activity: { create: mocks.activityCreate },
    customer: {
      create: mocks.customerCreate,
      delete: mocks.customerDelete,
      findMany: mocks.customerFindMany,
      findUnique: mocks.customerFindUnique,
      update: mocks.customerUpdate,
    },
    project: {
      create: mocks.projectCreate,
      delete: mocks.projectDelete,
      findMany: mocks.projectFindMany,
      findUnique: mocks.projectFindUnique,
      update: mocks.projectUpdate,
    },
    task: {
      aggregate: mocks.taskAggregate,
      create: mocks.taskCreate,
      delete: mocks.taskDelete,
      findFirst: mocks.taskFindFirst,
      findMany: mocks.taskFindMany,
      update: mocks.taskUpdate,
    },
    $transaction: mocks.transaction,
  },
}));

const baseDate = new Date("2026-07-03T00:00:00.000Z");

describe("api app", () => {
  beforeEach(() => {
    mocks.customerCreate.mockReset();
    mocks.customerDelete.mockReset();
    mocks.customerFindMany.mockReset();
    mocks.customerFindUnique.mockReset();
    mocks.customerUpdate.mockReset();
    mocks.readAppSession.mockReset();
    mocks.projectCreate.mockReset();
    mocks.projectDelete.mockReset();
    mocks.projectFindMany.mockReset();
    mocks.projectFindUnique.mockReset();
    mocks.projectUpdate.mockReset();
    mocks.taskCreate.mockReset();
    mocks.taskDelete.mockReset();
    mocks.taskAggregate.mockReset();
    mocks.taskFindFirst.mockReset();
    mocks.taskFindMany.mockReset();
    mocks.taskUpdate.mockReset();
    mocks.activityCreate.mockReset();
    mocks.transaction.mockReset();
    mocks.customerCreate.mockImplementation(({ data }) => Promise.resolve(createCustomer(data)));
    mocks.customerDelete.mockResolvedValue(createCustomer());
    mocks.customerFindMany.mockResolvedValue([]);
    mocks.customerFindUnique.mockResolvedValue(null);
    mocks.customerUpdate.mockImplementation(({ data, where }) =>
      Promise.resolve(createCustomer({ id: where.id, ...data })),
    );
    mocks.readAppSession.mockResolvedValue(null);
    mocks.projectCreate.mockImplementation(({ data }) => Promise.resolve(createProject(data)));
    mocks.projectDelete.mockResolvedValue(createProject());
    mocks.projectFindMany.mockResolvedValue([]);
    mocks.projectFindUnique.mockResolvedValue(null);
    mocks.projectUpdate.mockImplementation(({ data, where }) =>
      Promise.resolve(createProject({ id: where.id, ...data })),
    );
    mocks.taskCreate.mockImplementation(({ data }) => Promise.resolve(createTask(data)));
    mocks.taskDelete.mockResolvedValue(createTask());
    mocks.taskAggregate.mockResolvedValue({ _max: { order: null } });
    mocks.taskFindFirst.mockResolvedValue(null);
    mocks.taskFindMany.mockResolvedValue([]);
    mocks.taskUpdate.mockImplementation(({ data, where }) =>
      Promise.resolve(createTask({ id: where.id, ...data })),
    );
    mocks.activityCreate.mockImplementation(({ data }) =>
      Promise.resolve({ id: "activity-1", ...data }),
    );
    mocks.transaction.mockImplementation(
      createTransactionMock({
        activity: { create: mocks.activityCreate },
        project: { create: mocks.projectCreate, update: mocks.projectUpdate },
        task: {
          aggregate: mocks.taskAggregate,
          create: mocks.taskCreate,
          delete: mocks.taskDelete,
          findMany: mocks.taskFindMany,
          update: mocks.taskUpdate,
        },
      }),
    );
  });

  it("returns health status", async () => {
    const response = await app.request("/health");

    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "api",
    });
    expect(response.status).toBe(200);
  });

  it("requires a session to list customers", async () => {
    const response = await app.request("/customers");

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.customerFindMany).not.toHaveBeenCalled();
  });

  it("lists customers with project counts", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.customerFindMany.mockResolvedValue([
      {
        ...createCustomer({ id: "customer-1", name: "Acme" }),
        _count: { projects: 2 },
      },
    ]);

    const response = await app.request("/customers");

    await expect(response.json()).resolves.toEqual({
      customers: [
        {
          company: null,
          createdAt: baseDate.toISOString(),
          email: null,
          id: "customer-1",
          name: "Acme",
          notes: null,
          phone: null,
          projectCount: 2,
          updatedAt: baseDate.toISOString(),
        },
      ],
    });
    expect(response.status).toBe(200);
    expect(mocks.customerFindMany.mock.calls[0]?.[0].orderBy).toEqual([
      { name: "asc" },
      { id: "asc" },
    ]);
  });

  it("creates a customer", async () => {
    mocks.readAppSession.mockResolvedValue(true);

    const response = await app.request("/customers", {
      body: JSON.stringify({ company: "Acme Inc", email: " ", name: "  Acme  " }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      customer: {
        company: "Acme Inc",
        createdAt: baseDate.toISOString(),
        email: null,
        id: "customer-1",
        name: "Acme",
        notes: null,
        phone: null,
        updatedAt: baseDate.toISOString(),
      },
    });
    expect(response.status).toBe(201);
    expect(mocks.customerCreate.mock.calls[0]?.[0].data).toEqual({
      company: "Acme Inc",
      email: null,
      name: "Acme",
    });
  });

  it("returns a customer detail with projects", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.customerFindUnique.mockResolvedValue({
      ...createCustomer({ id: "customer-1", name: "Acme" }),
      _count: { projects: 1 },
      projects: [createCustomerProject()],
    });

    const response = await app.request("/customers/customer-1");

    await expect(response.json()).resolves.toEqual({
      customer: {
        company: null,
        createdAt: baseDate.toISOString(),
        email: null,
        id: "customer-1",
        name: "Acme",
        notes: null,
        phone: null,
        projectCount: 1,
        projects: [
          {
            budgetAmount: "1200.50",
            createdAt: baseDate.toISOString(),
            currency: "USD",
            deadline: baseDate.toISOString(),
            id: "project-1",
            name: "Website",
            status: "Active",
            updatedAt: baseDate.toISOString(),
          },
        ],
        updatedAt: baseDate.toISOString(),
      },
    });
    expect(response.status).toBe(200);
  });

  it("returns not_found for missing customers", async () => {
    mocks.readAppSession.mockResolvedValue(true);

    const response = await app.request("/customers/missing");

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
  });

  it("updates a customer", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.customerFindUnique.mockResolvedValue(createCustomerDetail());

    const response = await app.request("/customers/customer-1", {
      body: JSON.stringify({ phone: "555-0100" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(mocks.customerUpdate.mock.calls[0]?.[0]).toMatchObject({
      data: { phone: "555-0100" },
      where: { id: "customer-1" },
    });
  });

  it("deletes a customer", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.customerFindUnique.mockResolvedValue(createCustomerDetail());

    const response = await app.request("/customers/customer-1", { method: "DELETE" });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.customerDelete).toHaveBeenCalledWith({ where: { id: "customer-1" } });
  });

  it("requires a session to list projects", async () => {
    const response = await app.request("/projects");

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.projectFindMany).not.toHaveBeenCalled();
  });

  it("lists projects with a status filter", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindMany.mockResolvedValue([createProject()]);

    const response = await app.request("/projects?status=Active");

    await expect(response.json()).resolves.toMatchObject({
      projects: [
        {
          budgetAmount: "1200.5",
          customer: { id: "customer-1", name: "Acme" },
          id: "project-1",
          name: "Website",
          status: "Active",
        },
      ],
    });
    expect(response.status).toBe(200);
    expect(mocks.projectFindMany.mock.calls[0]?.[0].where).toEqual({ status: "Active" });
  });

  it("creates a project", async () => {
    mocks.readAppSession.mockResolvedValue(true);

    const response = await app.request("/projects", {
      body: JSON.stringify({
        budgetAmount: "1200.50",
        customerId: "customer-1",
        name: "  Website  ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(mocks.projectCreate.mock.calls[0]?.[0].data.name).toBe("Website");
    expect(mocks.projectCreate.mock.calls[0]?.[0].data.budgetAmount.toString()).toBe("1200.5");
  });

  it("returns project detail with decimal totals and metadata-only secrets", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindUnique.mockResolvedValue(createProjectDetail());

    const response = await app.request("/projects/project-1");

    const body = await response.json();

    expect(body).toMatchObject({
      project: {
        budgetAmount: "1200.5",
        id: "project-1",
        name: "Website",
        outstanding: "700.25",
        paidTotal: "500.25",
        payments: [{ amount: "500.25", id: "payment-1" }],
        secrets: [{ description: "CMS login", id: "secret-1", name: "WordPress" }],
      },
    });
    expect(response.status).toBe(200);
    expect(JSON.stringify(body)).not.toContain("encryptedValue");
  });

  it("returns not_found for missing projects", async () => {
    mocks.readAppSession.mockResolvedValue(true);

    const response = await app.request("/projects/missing");

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
  });

  it("updates a project", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });

    const response = await app.request("/projects/project-1", {
      body: JSON.stringify({ status: "OnHold" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(mocks.projectUpdate.mock.calls[0]?.[0]).toMatchObject({
      data: { status: "OnHold" },
      where: { id: "project-1" },
    });
  });

  it("deletes a project", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });

    const response = await app.request("/projects/project-1", { method: "DELETE" });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.projectDelete).toHaveBeenCalledWith({ where: { id: "project-1" } });
  });

  it("requires a session to list tasks", async () => {
    const response = await app.request("/projects/project-1/tasks");

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.taskFindMany).not.toHaveBeenCalled();
  });

  it("returns not_found when listing tasks for a missing project", async () => {
    mocks.readAppSession.mockResolvedValue(true);

    const response = await app.request("/projects/missing/tasks");

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
    expect(mocks.taskFindMany).not.toHaveBeenCalled();
  });

  it("lists project tasks", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
    mocks.taskFindMany.mockResolvedValue([createTask()]);

    const response = await app.request("/projects/project-1/tasks");

    await expect(response.json()).resolves.toMatchObject({
      tasks: [{ id: "task-1", order: 0, projectId: "project-1", title: "Design" }],
    });
    expect(response.status).toBe(200);
    expect(mocks.taskFindMany.mock.calls[0]?.[0].where).toEqual({ projectId: "project-1" });
  });

  it("creates a project task", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });

    const response = await app.request("/projects/project-1/tasks", {
      body: JSON.stringify({ order: 0, title: "  Design  " }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.status).toBe(201);
    expect(mocks.taskCreate.mock.calls[0]?.[0].data).toMatchObject({
      order: 0,
      projectId: "project-1",
      title: "Design",
    });
  });

  it("updates a project task", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
    mocks.taskFindFirst.mockResolvedValue({ id: "task-1" });

    const response = await app.request("/projects/project-1/tasks/task-1", {
      body: JSON.stringify({ status: "Done" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(mocks.taskUpdate.mock.calls[0]?.[0]).toMatchObject({
      data: { status: "Done" },
      where: { id: "task-1" },
    });
  });

  it("deletes a project task", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
    mocks.taskFindFirst.mockResolvedValue({ id: "task-1" });

    const response = await app.request("/projects/project-1/tasks/task-1", { method: "DELETE" });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.taskDelete).toHaveBeenCalledWith({ where: { id: "task-1" } });
  });

  it("reorders project tasks", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
    mocks.taskFindMany
      .mockResolvedValueOnce([{ id: "task-1" }, { id: "task-2" }])
      .mockResolvedValueOnce([
        createTask({ id: "task-2", order: 0 }),
        createTask({ id: "task-1", order: 1 }),
      ]);

    const response = await app.request("/projects/project-1/tasks/reorder", {
      body: JSON.stringify({ taskIds: ["task-2", "task-1"] }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    await expect(response.json()).resolves.toMatchObject({
      tasks: [
        { id: "task-2", order: 0 },
        { id: "task-1", order: 1 },
      ],
    });
    expect(response.status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });

  it("rejects task reorders with a mismatched id set", async () => {
    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
    mocks.taskFindMany.mockResolvedValue([{ id: "task-1" }]);

    const response = await app.request("/projects/project-1/tasks/reorder", {
      body: JSON.stringify({ taskIds: ["task-2"] }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({ error: "invalid_task_order" });
    expect(response.status).toBe(400);
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });
});

function createCustomer({
  company = null,
  email = null,
  id = "customer-1",
  name = "Acme",
  notes = null,
  phone = null,
}: {
  company?: string | null;
  email?: string | null;
  id?: string;
  name?: string;
  notes?: string | null;
  phone?: string | null;
} = {}) {
  return {
    company,
    createdAt: baseDate,
    email,
    id,
    name,
    notes,
    phone,
    updatedAt: baseDate,
  };
}

function createCustomerProject() {
  return {
    budgetAmount: { toString: () => "1200.50" },
    createdAt: baseDate,
    currency: "USD",
    deadline: baseDate,
    id: "project-1",
    name: "Website",
    status: "Active",
    updatedAt: baseDate,
  };
}

function createCustomerDetail() {
  return {
    ...createCustomer(),
    _count: { projects: 0 },
    projects: [],
  };
}

function createProject(input: Record<string, unknown> = {}) {
  return {
    budgetAmount: new Prisma.Decimal("1200.50"),
    createdAt: baseDate,
    currency: "USD",
    customer: { id: "customer-1", name: "Acme" },
    customerId: "customer-1",
    deadline: baseDate,
    description: null,
    id: "project-1",
    name: "Website",
    startDate: null,
    status: "Active",
    updatedAt: baseDate,
    ...input,
  };
}

function createProjectDetail() {
  return {
    ...createProject(),
    customer: createCustomer(),
    mcpTokens: [
      {
        createdAt: baseDate,
        id: "token-1",
        lastUsedAt: null,
        name: "Agent",
        revoked: false,
      },
    ],
    milestones: [],
    notes: [],
    payments: [
      {
        amount: new Prisma.Decimal("500.25"),
        date: baseDate,
        id: "payment-1",
        note: null,
        projectId: "project-1",
      },
    ],
    secrets: [{ description: "CMS login", id: "secret-1", name: "WordPress" }],
    tasks: [],
  };
}

function createTask(input: Record<string, unknown> = {}) {
  return {
    description: null,
    dueDate: null,
    id: "task-1",
    order: 0,
    priority: "None",
    projectId: "project-1",
    status: "Todo",
    title: "Design",
    ...input,
  };
}
