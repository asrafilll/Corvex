import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app";
import { decryptSecret, encryptSecret } from "../../utils/secret-crypto";
import { createAuthSession } from "../../test/helpers";

const mocks = vi.hoisted(() => ({
  authHandler: vi.fn(),
  getSession: vi.fn(),
  projectFindUnique: vi.fn(),
  secretCreate: vi.fn(),
  secretDelete: vi.fn(),
  secretFindFirst: vi.fn(),
  secretFindMany: vi.fn(),
  secretUpdate: vi.fn(),
}));

vi.mock("../auth/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
    handler: mocks.authHandler,
  },
}));

vi.mock("../../utils/prisma", () => ({
  Prisma,
  prisma: {
    project: {
      findUnique: mocks.projectFindUnique,
    },
    secret: {
      create: mocks.secretCreate,
      delete: mocks.secretDelete,
      findFirst: mocks.secretFindFirst,
      findMany: mocks.secretFindMany,
      update: mocks.secretUpdate,
    },
  },
}));

describe("secrets router", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }

    mocks.authHandler.mockResolvedValue(new Response(null, { status: 404 }));
    mocks.getSession.mockResolvedValue(createAuthSession());
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
    mocks.secretCreate.mockImplementation(({ data }) =>
      Promise.resolve({ id: "secret-1", name: data.name, description: data.description ?? null }),
    );
    mocks.secretDelete.mockResolvedValue({ id: "secret-1" });
    mocks.secretFindFirst.mockResolvedValue(null);
    mocks.secretFindMany.mockResolvedValue([]);
    mocks.secretUpdate.mockImplementation(({ data, where }) =>
      Promise.resolve({
        id: where.id,
        name: data.name ?? "Staging SSH",
        description: data.description ?? null,
      }),
    );
  });

  it("returns unauthorized without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await app.request("/projects/project-1/secrets");

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.secretFindMany).not.toHaveBeenCalled();
  });

  it("lists secrets without encryptedValue anywhere in the response", async () => {
    mocks.secretFindMany.mockResolvedValue([
      { id: "secret-1", name: "Staging SSH", description: "Deploy box" },
    ]);

    const response = await app.request("/projects/project-1/secrets");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).not.toContain("encryptedValue");
    expect(JSON.parse(body)).toEqual({
      secrets: [{ id: "secret-1", name: "Staging SSH", description: "Deploy box" }],
    });
    expect(mocks.secretFindMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, description: true },
    });
  });

  it("creates a secret storing only the encrypted value", async () => {
    const response = await app.request("/projects/project-1/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Staging SSH",
        description: "Deploy box",
        value: "hunter2-plaintext",
      }),
    });
    const body = await response.text();

    expect(response.status).toBe(201);
    expect(body).not.toContain("encryptedValue");
    expect(body).not.toContain("hunter2-plaintext");
    expect(JSON.parse(body)).toEqual({
      secret: { id: "secret-1", name: "Staging SSH", description: "Deploy box" },
    });

    const data = mocks.secretCreate.mock.calls[0]?.[0].data;
    expect(data.encryptedValue.startsWith("v1.")).toBe(true);
    expect(data.encryptedValue).not.toContain("hunter2-plaintext");
    expect(decryptSecret(data.encryptedValue)).toBe("hunter2-plaintext");
    expect(mocks.secretCreate.mock.calls[0]?.[0].select).toEqual({
      id: true,
      name: true,
      description: true,
    });
  });

  it("returns conflict for a duplicate name in the same project", async () => {
    mocks.secretCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        clientVersion: "7.0.0",
        code: "P2002",
      }),
    );

    const response = await app.request("/projects/project-1/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Staging SSH", value: "hunter2" }),
    });

    await expect(response.json()).resolves.toEqual({ error: "duplicate_secret_name" });
    expect(response.status).toBe(409);
  });

  it("allows the same name in a different project", async () => {
    mocks.projectFindUnique.mockResolvedValue({ id: "project-2" });

    const response = await app.request("/projects/project-2/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Staging SSH", value: "hunter2" }),
    });

    expect(response.status).toBe(201);
    expect(mocks.secretCreate.mock.calls[0]?.[0].data.projectId).toBe("project-2");
  });

  it("reveals a secret value round-tripping through encryption", async () => {
    mocks.secretFindFirst.mockResolvedValue({
      id: "secret-1",
      encryptedValue: encryptSecret("hunter2-plaintext"),
    });

    const response = await app.request("/projects/project-1/secrets/secret-1/reveal", {
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({ value: "hunter2-plaintext" });
    expect(response.status).toBe(200);
    expect(mocks.secretFindFirst).toHaveBeenCalledWith({
      where: { id: "secret-1", projectId: "project-1" },
      select: { id: true, encryptedValue: true },
    });
  });

  it("returns not_found when revealing a cross-project secret", async () => {
    const response = await app.request("/projects/project-2/secrets/secret-1/reveal", {
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
  });

  it("re-encrypts only when the update contains a value", async () => {
    mocks.secretFindFirst.mockResolvedValue({ id: "secret-1" });

    const withValue = await app.request("/projects/project-1/secrets/secret-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: "rotated" }),
    });

    expect(withValue.status).toBe(200);
    const valueUpdate = mocks.secretUpdate.mock.calls[0]?.[0].data;
    expect(decryptSecret(valueUpdate.encryptedValue)).toBe("rotated");

    const withoutValue = await app.request("/projects/project-1/secrets/secret-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Production SSH" }),
    });

    expect(withoutValue.status).toBe(200);
    const nameUpdate = mocks.secretUpdate.mock.calls[1]?.[0].data;
    expect(nameUpdate.encryptedValue).toBeUndefined();
    expect(nameUpdate.name).toBe("Production SSH");
  });

  it("returns not_found when creating on a missing project", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);

    const response = await app.request("/projects/missing/secrets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Staging SSH", value: "hunter2" }),
    });

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
    expect(mocks.secretCreate).not.toHaveBeenCalled();
  });

  it("deletes a secret", async () => {
    mocks.secretFindFirst.mockResolvedValue({ id: "secret-1" });

    const response = await app.request("/projects/project-1/secrets/secret-1", {
      method: "DELETE",
    });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.secretDelete).toHaveBeenCalledWith({ where: { id: "secret-1" } });
  });
});
