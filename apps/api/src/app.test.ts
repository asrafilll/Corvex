import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app";

const mocks = vi.hoisted(() => ({
  authHandler: vi.fn(),
  customerCreate: vi.fn(),
  customerDelete: vi.fn(),
  customerFindMany: vi.fn(),
  customerFindUnique: vi.fn(),
  customerUpdate: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  getSession: vi.fn(),
  update: vi.fn(),
}));

vi.mock("./modules/auth/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
    handler: mocks.authHandler,
  },
}));

vi.mock("./utils/prisma", () => ({
  prisma: {
    customer: {
      create: mocks.customerCreate,
      delete: mocks.customerDelete,
      findMany: mocks.customerFindMany,
      findUnique: mocks.customerFindUnique,
      update: mocks.customerUpdate,
    },
    user: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

const baseDate = new Date("2026-07-03T00:00:00.000Z");

describe("api app", () => {
  beforeEach(() => {
    mocks.authHandler.mockReset();
    mocks.customerCreate.mockReset();
    mocks.customerDelete.mockReset();
    mocks.customerFindMany.mockReset();
    mocks.customerFindUnique.mockReset();
    mocks.customerUpdate.mockReset();
    mocks.findMany.mockReset();
    mocks.findUnique.mockReset();
    mocks.getSession.mockReset();
    mocks.update.mockReset();

    mocks.authHandler.mockResolvedValue(new Response(null, { status: 404 }));
    mocks.customerCreate.mockImplementation(({ data }) => Promise.resolve(createCustomer(data)));
    mocks.customerDelete.mockResolvedValue(createCustomer());
    mocks.customerFindMany.mockResolvedValue([]);
    mocks.customerFindUnique.mockResolvedValue(null);
    mocks.customerUpdate.mockImplementation(({ data, where }) =>
      Promise.resolve(createCustomer({ id: where.id, ...data })),
    );
    mocks.findMany.mockResolvedValue([]);
    mocks.findUnique.mockResolvedValue(null);
    mocks.getSession.mockResolvedValue(null);
    mocks.update.mockImplementation(({ data, where }) =>
      Promise.resolve({
        createdAt: baseDate,
        email: `${where.id}@example.com`,
        emailVerified: true,
        id: where.id,
        image: data.image ?? "https://example.com/avatar.png",
        name: data.name,
        role: "user",
        updatedAt: baseDate,
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

  it("returns unauthorized when a session is missing", async () => {
    const response = await app.request("/session");

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
  });

  it("forbids users access without an admin session", async () => {
    const response = await app.request("/users");

    await expect(response.json()).resolves.toEqual({ error: "forbidden" });
    expect(response.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("validates users list limits", async () => {
    mocks.getSession.mockResolvedValue(createAuthSession("admin"));

    const response = await app.request("/users?limit=0");

    expect(response.status).toBe(400);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("returns paginated users for admins", async () => {
    mocks.getSession.mockResolvedValue(createAuthSession("admin"));
    mocks.findMany.mockResolvedValue([
      createUser({ id: "user-2", role: null }),
      createUser({ id: "user-1", role: "admin" }),
    ]);

    const response = await app.request("/users?limit=1");

    await expect(response.json()).resolves.toEqual({
      nextCursor: "user-2",
      users: [
        {
          createdAt: baseDate.toISOString(),
          email: "user-2@example.com",
          id: "user-2",
          name: "User user-2",
          role: "user",
          updatedAt: baseDate.toISOString(),
        },
      ],
    });
    expect(response.status).toBe(200);

    const query = mocks.findMany.mock.calls[0]?.[0];
    expect(query.take).toBe(2);
    expect(query.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
  });

  it("returns invalid_cursor for missing user cursors", async () => {
    mocks.getSession.mockResolvedValue(createAuthSession("admin"));
    mocks.findUnique.mockResolvedValue(null);

    const response = await app.request("/users?cursor=missing");

    await expect(response.json()).resolves.toEqual({ error: "invalid_cursor" });
    expect(response.status).toBe(400);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("requires a session to list customers", async () => {
    const response = await app.request("/customers");

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.customerFindMany).not.toHaveBeenCalled();
  });

  it("lists customers with project counts", async () => {
    mocks.getSession.mockResolvedValue(createAuthSession("user"));
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
    mocks.getSession.mockResolvedValue(createAuthSession("user"));

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
    mocks.getSession.mockResolvedValue(createAuthSession("user"));
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
    mocks.getSession.mockResolvedValue(createAuthSession("user"));

    const response = await app.request("/customers/missing");

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
  });

  it("updates a customer", async () => {
    mocks.getSession.mockResolvedValue(createAuthSession("user"));
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
    mocks.getSession.mockResolvedValue(createAuthSession("user"));
    mocks.customerFindUnique.mockResolvedValue(createCustomerDetail());

    const response = await app.request("/customers/customer-1", { method: "DELETE" });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.customerDelete).toHaveBeenCalledWith({ where: { id: "customer-1" } });
  });

  it("requires a session to update profile", async () => {
    const response = await app.request("/profile", {
      body: JSON.stringify({ name: "Updated User" }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates the current user's profile", async () => {
    mocks.getSession.mockResolvedValue(createAuthSession("user"));

    const response = await app.request("/profile", {
      body: JSON.stringify({
        image: "https://example.com/new-avatar.png",
        name: "  Updated User  ",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    await expect(response.json()).resolves.toEqual({
      user: {
        createdAt: baseDate.toISOString(),
        email: "auth-user-id@example.com",
        emailVerified: true,
        id: "auth-user-id",
        image: "https://example.com/new-avatar.png",
        name: "Updated User",
        role: "user",
        updatedAt: baseDate.toISOString(),
      },
    });
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({
      data: {
        image: "https://example.com/new-avatar.png",
        name: "Updated User",
      },
      select: {
        createdAt: true,
        email: true,
        emailVerified: true,
        id: true,
        image: true,
        name: true,
        role: true,
        updatedAt: true,
      },
      where: { id: "auth-user-id" },
    });
  });

  it("converts an empty profile image to null", async () => {
    mocks.getSession.mockResolvedValue(createAuthSession("user"));

    const response = await app.request("/profile", {
      body: JSON.stringify({
        image: " ",
        name: "Updated User",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(mocks.update.mock.calls[0]?.[0].data).toEqual({
      image: null,
      name: "Updated User",
    });
  });

  it("rejects invalid profile input", async () => {
    mocks.getSession.mockResolvedValue(createAuthSession("user"));

    const response = await app.request("/profile", {
      body: JSON.stringify({
        image: "ftp://example.com/avatar.png",
        name: "",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("ignores profile fields users are not allowed to change", async () => {
    mocks.getSession.mockResolvedValue(createAuthSession("user"));

    const response = await app.request("/profile", {
      body: JSON.stringify({
        email: "takeover@example.com",
        image: null,
        name: "Updated User",
        role: "admin",
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });

    expect(response.status).toBe(200);
    expect(mocks.update.mock.calls[0]?.[0].data).toEqual({
      image: null,
      name: "Updated User",
    });
  });
});

function createAuthSession(role: string) {
  return {
    session: {
      createdAt: baseDate,
      expiresAt: baseDate,
      id: "session-id",
      token: "session-token",
      updatedAt: baseDate,
      userId: "auth-user-id",
    },
    user: {
      createdAt: baseDate,
      email: "admin@example.com",
      emailVerified: true,
      id: "auth-user-id",
      image: null,
      name: "Admin User",
      role,
      updatedAt: baseDate,
    },
  };
}

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

function createUser({
  id,
  image = null,
  name = `User ${id}`,
  role,
}: {
  id: string;
  image?: string | null;
  name?: string;
  role: string | null;
}) {
  return {
    banned: null,
    banExpires: null,
    banReason: null,
    createdAt: baseDate,
    email: `${id}@example.com`,
    emailVerified: true,
    id,
    image,
    name,
    role,
    updatedAt: baseDate,
  };
}
