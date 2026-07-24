import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { appActivityActor } from "../activities/services";
import { type AppAuthVariables, requireAppSession } from "../auth/middleware";
import { findProjectOrNull } from "../projects/services";
import {
  createNoteSchema,
  noteParamSchema,
  projectNotesParamSchema,
  updateNoteSchema,
} from "./schema";
import { createNote, deleteNote, findNoteOrNull, listNotes, updateNote } from "./services";

export const projectNotesRouter = new Hono<{ Variables: AppAuthVariables }>()
  .get("/", zValidator("param", projectNotesParamSchema), async (c) => {
    const hasSession = requireAppSession(c);

    if (!hasSession) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId } = c.req.valid("param");

    if (!(await findProjectOrNull(projectId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await listNotes(projectId), 200);
  })
  .post(
    "/",
    zValidator("param", projectNotesParamSchema),
    zValidator("json", createNoteSchema),
    async (c) => {
      const hasSession = requireAppSession(c);

      if (!hasSession) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId } = c.req.valid("param");

      if (!(await findProjectOrNull(projectId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(await createNote(projectId, c.req.valid("json"), appActivityActor), 201);
    },
  )
  .patch(
    "/:noteId",
    zValidator("param", noteParamSchema),
    zValidator("json", updateNoteSchema),
    async (c) => {
      const hasSession = requireAppSession(c);

      if (!hasSession) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const { projectId, noteId } = c.req.valid("param");

      if (!(await findNoteOrNull(projectId, noteId))) {
        return c.json({ error: "not_found" }, 404);
      }

      return c.json(
        await updateNote(projectId, noteId, c.req.valid("json"), appActivityActor),
        200,
      );
    },
  )
  .delete("/:noteId", zValidator("param", noteParamSchema), async (c) => {
    const hasSession = requireAppSession(c);

    if (!hasSession) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const { projectId, noteId } = c.req.valid("param");

    if (!(await findNoteOrNull(projectId, noteId))) {
      return c.json({ error: "not_found" }, 404);
    }

    return c.json(await deleteNote(projectId, noteId, appActivityActor), 200);
  });
