import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app";

const mocks = vi.hoisted(() => ({
  customerFindMany: vi.fn(),
  noteFindMany: vi.fn(),
  projectFindMany: vi.fn(),
  readAppSession: vi.fn(),
  taskFindMany: vi.fn(),
}));

vi.mock("../auth/auth", () => ({
  readAppSession: mocks.readAppSession,
}));

vi.mock("../../utils/prisma", () => ({
  Prisma,
  prisma: {
    customer: { findMany: mocks.customerFindMany },
    note: { findMany: mocks.noteFindMany },
    project: { findMany: mocks.projectFindMany },
    task: { findMany: mocks.taskFindMany },
  },
}));

describe("search router", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }

    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindMany.mockResolvedValue([]);
    mocks.customerFindMany.mockResolvedValue([]);
    mocks.taskFindMany.mockResolvedValue([]);
    mocks.noteFindMany.mockResolvedValue([]);
  });

  it("returns unauthorized without an app session", async () => {
    mocks.readAppSession.mockResolvedValue(null);

    const response = await app.request("/search?q=corvex");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(mocks.projectFindMany).not.toHaveBeenCalled();
  });

  it("searches only allowlisted workspace resources", async () => {
    mocks.projectFindMany.mockResolvedValue([
      { id: "project-1", name: "Corvex", status: "Active" },
    ]);
    mocks.customerFindMany.mockResolvedValue([
      { id: "customer-1", name: "Acme", company: "Corvex partner" },
    ]);
    mocks.taskFindMany.mockResolvedValue([
      {
        id: "task-1",
        title: "Ship Corvex",
        status: "InProgress",
        project: { id: "project-1", name: "Corvex" },
      },
    ]);
    mocks.noteFindMany.mockResolvedValue([
      {
        id: "note-1",
        title: "Corvex handoff",
        project: { id: "project-1", name: "Corvex" },
      },
    ]);

    const response = await app.request("/search?q=%20corvex%20");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).not.toContain("Secret");
    expect(body).not.toContain("McpToken");
    expect(JSON.parse(body).results).toHaveLength(4);
    expect(mocks.projectFindMany.mock.calls[0]?.[0].where).toEqual({
      name: { contains: "corvex", mode: "insensitive" },
    });
  });

  it("rejects an empty query", async () => {
    const response = await app.request("/search?q=%20%20");

    expect(response.status).toBe(400);
    expect(mocks.projectFindMany).not.toHaveBeenCalled();
  });
});
