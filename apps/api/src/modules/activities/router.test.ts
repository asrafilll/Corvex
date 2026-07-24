import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app";
import { baseDate } from "../../test/helpers";

const mocks = vi.hoisted(() => ({
  activityFindMany: vi.fn(),
  projectFindUnique: vi.fn(),
  readAppSession: vi.fn(),
}));

vi.mock("../auth/auth", () => ({
  readAppSession: mocks.readAppSession,
}));

vi.mock("../../utils/prisma", () => ({
  Prisma,
  prisma: {
    activity: { findMany: mocks.activityFindMany },
    project: { findUnique: mocks.projectFindUnique },
  },
}));

describe("activities router", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }

    mocks.readAppSession.mockResolvedValue(true);
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
    mocks.activityFindMany.mockResolvedValue([]);
  });

  it("returns unauthorized without an app session", async () => {
    mocks.readAppSession.mockResolvedValue(null);

    const response = await app.request("/projects/project-1/activities");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(mocks.activityFindMany).not.toHaveBeenCalled();
  });

  it("returns not_found for a missing project", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);

    const response = await app.request("/projects/missing/activities");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "not_found" });
  });

  it("lists immutable, allowlisted activity metadata", async () => {
    mocks.activityFindMany.mockResolvedValue([
      {
        id: "activity-1",
        actorType: "Mcp",
        actorLabel: "Claude Code",
        mcpTokenId: "token-1",
        action: "Updated",
        entityType: "Task",
        entityId: "task-1",
        entityLabel: "Ship Corvex",
        createdAt: baseDate,
      },
    ]);

    const response = await app.request("/projects/project-1/activities?limit=25");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).not.toContain("tokenHash");
    expect(body).not.toContain("encryptedValue");
    expect(JSON.parse(body)).toEqual({
      activities: [
        {
          id: "activity-1",
          actorType: "Mcp",
          actorLabel: "Claude Code",
          mcpTokenId: "token-1",
          action: "Updated",
          entityType: "Task",
          entityId: "task-1",
          entityLabel: "Ship Corvex",
          createdAt: baseDate.toISOString(),
        },
      ],
    });
    expect(mocks.activityFindMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 25,
      select: {
        id: true,
        actorType: true,
        actorLabel: true,
        mcpTokenId: true,
        action: true,
        entityType: true,
        entityId: true,
        entityLabel: true,
        createdAt: true,
      },
    });
  });
});
