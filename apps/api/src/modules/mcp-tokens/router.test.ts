import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app";
import { baseDate, createTransactionMock } from "../../test/helpers";

const mocks = vi.hoisted(() => ({
  readAppSession: vi.fn(),
  mcpTokenCreate: vi.fn(),
  mcpTokenFindFirst: vi.fn(),
  mcpTokenFindMany: vi.fn(),
  mcpTokenUpdate: vi.fn(),
  projectFindUnique: vi.fn(),
  activityCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../auth/auth", () => ({
  readAppSession: mocks.readAppSession,
}));

vi.mock("../../utils/prisma", () => ({
  Prisma,
  prisma: {
    activity: { create: mocks.activityCreate },
    mcpToken: {
      create: mocks.mcpTokenCreate,
      findFirst: mocks.mcpTokenFindFirst,
      findMany: mocks.mcpTokenFindMany,
      update: mocks.mcpTokenUpdate,
    },
    project: {
      findUnique: mocks.projectFindUnique,
    },
    $transaction: mocks.transaction,
  },
}));

describe("mcp tokens router", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }

    mocks.readAppSession.mockResolvedValue(true);
    mocks.mcpTokenCreate.mockImplementation(({ data }) =>
      Promise.resolve(createMcpToken({ name: data.name })),
    );
    mocks.mcpTokenFindFirst.mockResolvedValue(null);
    mocks.mcpTokenFindMany.mockResolvedValue([]);
    mocks.mcpTokenUpdate.mockImplementation(({ data, where }) =>
      Promise.resolve(createMcpToken({ id: where.id, ...data })),
    );
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
    mocks.activityCreate.mockImplementation(({ data }) =>
      Promise.resolve({ id: "activity-1", ...data }),
    );
    mocks.transaction.mockImplementation(
      createTransactionMock({
        activity: { create: mocks.activityCreate },
        mcpToken: { create: mocks.mcpTokenCreate, update: mocks.mcpTokenUpdate },
      }),
    );
  });

  it("returns unauthorized without a session", async () => {
    mocks.readAppSession.mockResolvedValue(null);

    const response = await app.request("/projects/project-1/mcp-tokens");

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.mcpTokenFindMany).not.toHaveBeenCalled();
  });

  it("lists token metadata without tokenHash anywhere in the response", async () => {
    mocks.mcpTokenFindMany.mockResolvedValue([createMcpToken()]);

    const response = await app.request("/projects/project-1/mcp-tokens");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).not.toContain("tokenHash");
    expect(JSON.parse(body)).toEqual({
      mcpTokens: [
        {
          createdAt: baseDate.toISOString(),
          id: "token-1",
          lastUsedAt: null,
          name: "Claude Code",
          revoked: false,
        },
      ],
    });
    expect(mocks.mcpTokenFindMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true, name: true, createdAt: true, lastUsedAt: true, revoked: true },
    });
  });

  it("creates a token returning the raw value once while storing only its hash", async () => {
    const response = await app.request("/projects/project-1/mcp-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Claude Code" }),
    });
    const body = await response.text();
    const parsed = JSON.parse(body);

    expect(response.status).toBe(201);
    expect(parsed.token).toMatch(/^cvx_[A-Za-z0-9_-]{43}$/);
    expect(body).not.toContain("tokenHash");
    expect(parsed.mcpToken).toEqual({
      createdAt: baseDate.toISOString(),
      id: "token-1",
      lastUsedAt: null,
      name: "Claude Code",
      revoked: false,
    });

    const data = mocks.mcpTokenCreate.mock.calls[0]?.[0].data;
    expect(data.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(data.tokenHash).toBe(createHash("sha256").update(parsed.token).digest("hex"));
    expect(data).not.toHaveProperty("token");
    const activityData = JSON.stringify(mocks.activityCreate.mock.calls[0]?.[0].data);
    expect(activityData).not.toContain(parsed.token);
    expect(activityData).not.toContain(data.tokenHash);
  });

  it("returns not_found when creating on a missing project", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);

    const response = await app.request("/projects/missing/mcp-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Claude Code" }),
    });

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
    expect(mocks.mcpTokenCreate).not.toHaveBeenCalled();
  });

  it("revokes a token", async () => {
    mocks.mcpTokenFindFirst.mockResolvedValue({ id: "token-1" });

    const response = await app.request("/projects/project-1/mcp-tokens/token-1/revoke", {
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      mcpToken: {
        createdAt: baseDate.toISOString(),
        id: "token-1",
        lastUsedAt: null,
        name: "Claude Code",
        revoked: true,
      },
    });
    expect(response.status).toBe(200);
    expect(mocks.mcpTokenUpdate).toHaveBeenCalledWith({
      where: { id: "token-1" },
      data: { revoked: true },
      select: { id: true, name: true, createdAt: true, lastUsedAt: true, revoked: true },
    });
  });

  it("returns not_found when revoking a cross-project token", async () => {
    const response = await app.request("/projects/project-2/mcp-tokens/token-1/revoke", {
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
    expect(mocks.mcpTokenUpdate).not.toHaveBeenCalled();
    expect(mocks.mcpTokenFindFirst).toHaveBeenCalledWith({
      where: { id: "token-1", projectId: "project-2" },
      select: { id: true },
    });
  });
});

function createMcpToken(overrides: Record<string, unknown> = {}) {
  return {
    id: "token-1",
    name: "Claude Code",
    createdAt: baseDate,
    lastUsedAt: null,
    revoked: false,
    ...overrides,
  };
}
