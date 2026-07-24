import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app";
import { hashMcpToken } from "../../utils/mcp-token";
import { baseDate, createTransactionMock } from "../../test/helpers";

const validToken = "cvx_test-token";

const mocks = vi.hoisted(() => ({
  mcpTokenFindUnique: vi.fn(),
  mcpTokenUpdate: vi.fn(),
  projectFindUnique: vi.fn(),
  taskFindMany: vi.fn(),
  taskFindFirst: vi.fn(),
  taskCreate: vi.fn(),
  taskUpdate: vi.fn(),
  taskAggregate: vi.fn(),
  noteFindMany: vi.fn(),
  noteFindFirst: vi.fn(),
  noteCreate: vi.fn(),
  milestoneFindMany: vi.fn(),
  secretFindMany: vi.fn(),
  activityCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../../utils/prisma", () => ({
  Prisma,
  prisma: {
    activity: { create: mocks.activityCreate },
    mcpToken: { findUnique: mocks.mcpTokenFindUnique, update: mocks.mcpTokenUpdate },
    project: { findUnique: mocks.projectFindUnique },
    task: {
      findMany: mocks.taskFindMany,
      findFirst: mocks.taskFindFirst,
      create: mocks.taskCreate,
      update: mocks.taskUpdate,
      aggregate: mocks.taskAggregate,
    },
    note: {
      findMany: mocks.noteFindMany,
      findFirst: mocks.noteFindFirst,
      create: mocks.noteCreate,
    },
    milestone: { findMany: mocks.milestoneFindMany },
    secret: { findMany: mocks.secretFindMany },
    $transaction: mocks.transaction,
  },
}));

async function rpc(
  method: string,
  params?: unknown,
  { token = validToken }: { token?: string | null } = {},
) {
  return app.request("/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
}

// Tool results carry their payload as a JSON string in the first text content
// block; this unwraps it.
async function callTool(name: string, args?: Record<string, unknown>) {
  const response = await rpc("tools/call", { name, arguments: args ?? {} });
  const body = (await response.json()) as {
    result: { isError?: boolean; content: { type: string; text: string }[] };
  };

  return {
    isError: body.result.isError ?? false,
    text: body.result.content[0]?.text ?? "",
  };
}

describe("mcp router", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }

    mocks.mcpTokenFindUnique.mockImplementation(({ where }) =>
      Promise.resolve(
        where.tokenHash === hashMcpToken(validToken)
          ? {
              id: "token-1",
              name: "Claude Code",
              projectId: "project-1",
              revoked: false,
              lastUsedAt: null,
            }
          : null,
      ),
    );
    mocks.mcpTokenUpdate.mockResolvedValue({ id: "token-1" });
    mocks.projectFindUnique.mockResolvedValue({
      id: "project-1",
      name: "Corvex",
      description: "MCP-native PM",
      status: "Active",
      startDate: null,
      deadline: null,
      createdAt: baseDate,
      updatedAt: baseDate,
      customer: { id: "customer-1", name: "Acme" },
      milestones: [{ id: "milestone-1", name: "Launch", date: baseDate, done: false }],
    });
    mocks.taskFindMany.mockResolvedValue([]);
    mocks.taskFindFirst.mockResolvedValue(null);
    mocks.taskAggregate.mockResolvedValue({ _max: { order: null } });
    mocks.taskCreate.mockImplementation(({ data }) => Promise.resolve({ id: "task-1", ...data }));
    mocks.taskUpdate.mockImplementation(({ where, data }) =>
      Promise.resolve({ id: where.id, ...data }),
    );
    mocks.noteFindMany.mockResolvedValue([]);
    mocks.noteFindFirst.mockResolvedValue(null);
    mocks.noteCreate.mockImplementation(({ data }) => Promise.resolve({ id: "note-1", ...data }));
    mocks.milestoneFindMany.mockResolvedValue([]);
    mocks.secretFindMany.mockResolvedValue([]);
    mocks.activityCreate.mockImplementation(({ data }) =>
      Promise.resolve({ id: "activity-1", ...data }),
    );
    mocks.transaction.mockImplementation(
      createTransactionMock({
        activity: { create: mocks.activityCreate },
        note: { create: mocks.noteCreate },
        task: {
          aggregate: mocks.taskAggregate,
          create: mocks.taskCreate,
          update: mocks.taskUpdate,
        },
      }),
    );
  });

  it("rejects a request with no token", async () => {
    const response = await rpc("initialize", {}, { token: null });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(mocks.mcpTokenFindUnique).not.toHaveBeenCalled();
  });

  it("rejects a revoked token", async () => {
    mocks.mcpTokenFindUnique.mockResolvedValue({
      id: "token-1",
      projectId: "project-1",
      revoked: true,
      lastUsedAt: null,
    });

    const response = await rpc("tools/list");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("initializes over JSON-RPC", async () => {
    const response = await rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "0" },
    });
    const body = (await response.json()) as {
      result: { serverInfo: { name: string } };
    };

    expect(response.status).toBe(200);
    expect(body.result.serverInfo.name).toBe("corvex");
  });

  it("lists tools, none of which accept a projectId", async () => {
    const response = await rpc("tools/list", {});
    const body = (await response.json()) as {
      result: { tools: { name: string; inputSchema?: { properties?: Record<string, unknown> } }[] };
    };

    const names = body.result.tools.map((tool) => tool.name).sort();
    expect(names).toEqual([
      "add_note",
      "create_task",
      "get_note",
      "get_project",
      "get_task",
      "list_milestones",
      "list_notes",
      "list_secrets",
      "list_tasks",
      "update_task",
    ]);

    for (const tool of body.result.tools) {
      expect(Object.keys(tool.inputSchema?.properties ?? {})).not.toContain("projectId");
    }
  });

  it("get_project omits budget, currency, and payments", async () => {
    const { isError, text } = await callTool("get_project");

    expect(isError).toBe(false);
    expect(text).not.toContain("budget");
    expect(text).not.toContain("currency");
    expect(text).not.toContain("payment");
    expect(JSON.parse(text).name).toBe("Corvex");
  });

  it("list_secrets never returns values", async () => {
    mocks.secretFindMany.mockResolvedValue([
      { id: "secret-1", name: "DATABASE_URL", description: "prod db" },
    ]);

    const { text } = await callTool("list_secrets");

    expect(text).not.toContain("encryptedValue");
    expect(text).not.toContain("value");
    expect(mocks.secretFindMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true, description: true },
    });
  });

  it("creates a task scoped to the token's project", async () => {
    const { isError, text } = await callTool("create_task", { title: "Ship MCP" });

    expect(isError).toBe(false);
    expect(JSON.parse(text).title).toBe("Ship MCP");
    expect(mocks.taskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ projectId: "project-1", title: "Ship MCP" }),
    });
    expect(mocks.activityCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorLabel: "Claude Code",
        actorType: "Mcp",
        entityLabel: "Ship MCP",
        entityType: "Task",
        mcpTokenId: "token-1",
        projectId: "project-1",
      }),
    });
  });

  it("cannot reach another project's task", async () => {
    // Token is scoped to project-1; a task id from project-2 is looked up under
    // project-1 and therefore not found.
    const { isError, text } = await callTool("get_task", { taskId: "task-from-project-2" });

    expect(isError).toBe(true);
    expect(text).toBe("Task not found.");
    expect(mocks.taskFindFirst).toHaveBeenCalledWith({
      where: { id: "task-from-project-2", projectId: "project-1" },
    });
  });
});
