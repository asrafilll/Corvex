import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app";
import { baseDate, createAuthSession } from "../../test/helpers";

const mocks = vi.hoisted(() => ({
  authHandler: vi.fn(),
  getSession: vi.fn(),
  noteCreate: vi.fn(),
  noteDelete: vi.fn(),
  noteFindFirst: vi.fn(),
  noteFindMany: vi.fn(),
  noteUpdate: vi.fn(),
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
    note: {
      create: mocks.noteCreate,
      delete: mocks.noteDelete,
      findFirst: mocks.noteFindFirst,
      findMany: mocks.noteFindMany,
      update: mocks.noteUpdate,
    },
    project: {
      findUnique: mocks.projectFindUnique,
    },
  },
}));

describe("project notes router", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }

    mocks.authHandler.mockResolvedValue(new Response(null, { status: 404 }));
    mocks.getSession.mockResolvedValue(createAuthSession());
    mocks.noteCreate.mockImplementation(({ data }) => Promise.resolve(createNote(data)));
    mocks.noteDelete.mockResolvedValue(createNote());
    mocks.noteFindFirst.mockResolvedValue(null);
    mocks.noteFindMany.mockResolvedValue([]);
    mocks.noteUpdate.mockImplementation(({ data, where }) =>
      Promise.resolve(createNote({ id: where.id, ...data })),
    );
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
  });

  it("returns unauthorized without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const response = await app.request("/projects/project-1/notes");

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.noteFindMany).not.toHaveBeenCalled();
  });

  it("lists notes ordered by updatedAt desc", async () => {
    mocks.noteFindMany.mockResolvedValue([createNote({ id: "note-1" })]);

    const response = await app.request("/projects/project-1/notes");

    await expect(response.json()).resolves.toEqual({
      notes: [
        {
          body: "Kickoff summary",
          createdAt: baseDate.toISOString(),
          id: "note-1",
          projectId: "project-1",
          title: "Kickoff",
          updatedAt: baseDate.toISOString(),
        },
      ],
    });
    expect(response.status).toBe(200);
    expect(mocks.noteFindMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });
  });

  it("creates a note", async () => {
    const response = await app.request("/projects/project-1/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Kickoff", body: "Kickoff summary" }),
    });

    await expect(response.json()).resolves.toEqual({
      note: {
        body: "Kickoff summary",
        createdAt: baseDate.toISOString(),
        id: "note-1",
        projectId: "project-1",
        title: "Kickoff",
        updatedAt: baseDate.toISOString(),
      },
    });
    expect(response.status).toBe(201);
    expect(mocks.noteCreate).toHaveBeenCalledWith({
      data: { title: "Kickoff", body: "Kickoff summary", projectId: "project-1" },
    });
  });

  it("returns not_found when creating on a missing project", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);

    const response = await app.request("/projects/missing/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Kickoff", body: "Kickoff summary" }),
    });

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
    expect(mocks.noteCreate).not.toHaveBeenCalled();
  });

  it("updates a note", async () => {
    mocks.noteFindFirst.mockResolvedValue({ id: "note-1" });

    const response = await app.request("/projects/project-1/notes/note-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Revised summary" }),
    });

    await expect(response.json()).resolves.toMatchObject({
      note: { body: "Revised summary", id: "note-1" },
    });
    expect(response.status).toBe(200);
    expect(mocks.noteUpdate).toHaveBeenCalledWith({
      where: { id: "note-1" },
      data: { body: "Revised summary" },
    });
  });

  it("returns not_found for cross-project note access", async () => {
    const response = await app.request("/projects/project-2/notes/note-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Revised summary" }),
    });

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
    expect(mocks.noteUpdate).not.toHaveBeenCalled();
    expect(mocks.noteFindFirst).toHaveBeenCalledWith({
      where: { id: "note-1", projectId: "project-2" },
      select: { id: true },
    });
  });

  it("deletes a note", async () => {
    mocks.noteFindFirst.mockResolvedValue({ id: "note-1" });

    const response = await app.request("/projects/project-1/notes/note-1", {
      method: "DELETE",
    });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.noteDelete).toHaveBeenCalledWith({ where: { id: "note-1" } });
  });
});

function createNote(overrides: Record<string, unknown> = {}) {
  return {
    id: "note-1",
    title: "Kickoff",
    body: "Kickoff summary",
    projectId: "project-1",
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  };
}
