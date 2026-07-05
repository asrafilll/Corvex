import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app";
import { baseDate, createAuthSession } from "../../test/helpers";

const mocks = vi.hoisted(() => ({
  authHandler: vi.fn(),
  getSession: vi.fn(),
  milestoneCreate: vi.fn(),
  milestoneDelete: vi.fn(),
  milestoneFindFirst: vi.fn(),
  milestoneFindMany: vi.fn(),
  milestoneUpdate: vi.fn(),
  projectFindUnique: vi.fn(),
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
    milestone: {
      create: mocks.milestoneCreate,
      delete: mocks.milestoneDelete,
      findFirst: mocks.milestoneFindFirst,
      findMany: mocks.milestoneFindMany,
      update: mocks.milestoneUpdate,
    },
    project: {
      findUnique: mocks.projectFindUnique,
    },
  },
}));

describe("milestones router", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }

    mocks.authHandler.mockResolvedValue(new Response(null, { status: 404 }));
    mocks.getSession.mockResolvedValue(createAuthSession());
    mocks.milestoneCreate.mockImplementation(({ data }) => Promise.resolve(createMilestone(data)));
    mocks.milestoneDelete.mockResolvedValue(createMilestone());
    mocks.milestoneFindFirst.mockResolvedValue(null);
    mocks.milestoneFindMany.mockResolvedValue([]);
    mocks.milestoneUpdate.mockImplementation(({ data, where }) =>
      Promise.resolve(createMilestone({ id: where.id, ...data })),
    );
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
  });

  it("returns unauthorized without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await app.request("/projects/project-1/milestones");

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.milestoneFindMany).not.toHaveBeenCalled();
  });

  it("lists milestones ordered by date", async () => {
    mocks.milestoneFindMany.mockResolvedValue([
      createMilestone({ id: "milestone-1" }),
      createMilestone({ id: "milestone-2", done: true }),
    ]);

    const response = await app.request("/projects/project-1/milestones");

    await expect(response.json()).resolves.toEqual({
      milestones: [
        {
          date: baseDate.toISOString(),
          done: false,
          id: "milestone-1",
          name: "Design handoff",
          projectId: "project-1",
        },
        {
          date: baseDate.toISOString(),
          done: true,
          id: "milestone-2",
          name: "Design handoff",
          projectId: "project-1",
        },
      ],
    });
    expect(response.status).toBe(200);
    expect(mocks.milestoneFindMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    });
  });

  it("creates a milestone", async () => {
    const response = await app.request("/projects/project-1/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Launch", date: baseDate.toISOString() }),
    });

    await expect(response.json()).resolves.toEqual({
      milestone: {
        date: baseDate.toISOString(),
        done: false,
        id: "milestone-1",
        name: "Launch",
        projectId: "project-1",
      },
    });
    expect(response.status).toBe(201);
    expect(mocks.milestoneCreate).toHaveBeenCalledWith({
      data: { name: "Launch", date: baseDate, projectId: "project-1" },
    });
  });

  it("returns not_found when creating on a missing project", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);

    const response = await app.request("/projects/missing/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Launch", date: baseDate.toISOString() }),
    });

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
    expect(mocks.milestoneCreate).not.toHaveBeenCalled();
  });

  it("toggles a milestone done", async () => {
    mocks.milestoneFindFirst.mockResolvedValue({ id: "milestone-1" });

    const response = await app.request("/projects/project-1/milestones/milestone-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });

    await expect(response.json()).resolves.toEqual({
      milestone: {
        date: baseDate.toISOString(),
        done: true,
        id: "milestone-1",
        name: "Design handoff",
        projectId: "project-1",
      },
    });
    expect(response.status).toBe(200);
    expect(mocks.milestoneFindFirst).toHaveBeenCalledWith({
      where: { id: "milestone-1", projectId: "project-1" },
      select: { id: true },
    });
    expect(mocks.milestoneUpdate).toHaveBeenCalledWith({
      where: { id: "milestone-1" },
      data: { done: true },
    });
  });

  it("returns not_found for cross-project milestone access", async () => {
    const response = await app.request("/projects/project-2/milestones/milestone-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
    expect(mocks.milestoneUpdate).not.toHaveBeenCalled();
  });

  it("deletes a milestone", async () => {
    mocks.milestoneFindFirst.mockResolvedValue({ id: "milestone-1" });

    const response = await app.request("/projects/project-1/milestones/milestone-1", {
      method: "DELETE",
    });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.milestoneDelete).toHaveBeenCalledWith({ where: { id: "milestone-1" } });
  });
});

function createMilestone(overrides: Record<string, unknown> = {}) {
  return {
    id: "milestone-1",
    name: "Design handoff",
    date: baseDate,
    done: false,
    projectId: "project-1",
    ...overrides,
  };
}
