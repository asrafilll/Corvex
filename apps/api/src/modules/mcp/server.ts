import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createNote, listNotes } from "../project-notes/services";
import { listSecrets } from "../secrets/services";
import { taskPriorityValues, taskStatusValues } from "../tasks/schema";
import { createTask, updateTask } from "../tasks/services";
import { getMcpNote, getMcpProject, getMcpTask, listMcpMilestones, listMcpTasks } from "./services";

// Dates cross MCP as ISO 8601 strings — z.date() has no JSON Schema form.
// A string refinement keeps the schema serializable while still validating.
const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Must be an ISO 8601 date string")
  .describe("ISO 8601 date, e.g. 2026-07-10 or 2026-07-10T09:00:00Z");

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

// Every tool is scoped to `projectId` via closure — no tool accepts a project
// id, so a token can only ever reach its own project (ADR-0002).
export function buildMcpServer(projectId: string) {
  const server = new McpServer(
    { name: "corvex", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "get_project",
    {
      description:
        "Get this project's details: name, description, status, dates, customer, and milestones. Budget and payments are intentionally not exposed over MCP.",
    },
    async () => {
      const project = await getMcpProject(projectId);
      return project ? ok(project) : fail("Project not found.");
    },
  );

  server.registerTool(
    "list_tasks",
    {
      description: "List the project's tasks, optionally filtered by status.",
      inputSchema: { status: z.enum(taskStatusValues).optional() },
    },
    async ({ status }) => ok(await listMcpTasks(projectId, status)),
  );

  server.registerTool(
    "get_task",
    {
      description: "Get a single task by id.",
      inputSchema: { taskId: z.string().trim().min(1) },
    },
    async ({ taskId }) => {
      const task = await getMcpTask(projectId, taskId);
      return task ? ok(task) : fail("Task not found.");
    },
  );

  server.registerTool(
    "create_task",
    {
      description: "Create a task in the project.",
      inputSchema: {
        title: z.string().trim().min(1).max(300),
        description: z.string().trim().optional(),
        status: z.enum(taskStatusValues).optional(),
        priority: z.enum(taskPriorityValues).optional(),
        dueDate: isoDate.optional(),
      },
    },
    async ({ dueDate, ...input }) =>
      ok(
        (
          await createTask(projectId, {
            ...input,
            dueDate: dueDate === undefined ? undefined : new Date(dueDate),
          })
        ).task,
      ),
  );

  server.registerTool(
    "update_task",
    {
      description: "Update fields on an existing task.",
      inputSchema: {
        taskId: z.string().trim().min(1),
        title: z.string().trim().min(1).max(300).optional(),
        description: z.string().trim().nullable().optional(),
        status: z.enum(taskStatusValues).optional(),
        priority: z.enum(taskPriorityValues).optional(),
        dueDate: isoDate.nullable().optional(),
      },
    },
    async ({ taskId, dueDate, ...fields }) => {
      if (Object.keys(fields).length === 0 && dueDate === undefined) {
        return fail("Provide at least one field to update.");
      }

      if (!(await getMcpTask(projectId, taskId))) {
        return fail("Task not found.");
      }

      return ok(
        (
          await updateTask(taskId, {
            ...fields,
            dueDate:
              dueDate === undefined ? undefined : dueDate === null ? null : new Date(dueDate),
          })
        ).task,
      );
    },
  );

  server.registerTool(
    "list_notes",
    { description: "List the project's notes (title and markdown body)." },
    async () => ok((await listNotes(projectId)).notes),
  );

  server.registerTool(
    "get_note",
    {
      description: "Get a single note by id.",
      inputSchema: { noteId: z.string().trim().min(1) },
    },
    async ({ noteId }) => {
      const note = await getMcpNote(projectId, noteId);
      return note ? ok(note) : fail("Note not found.");
    },
  );

  server.registerTool(
    "add_note",
    {
      description: "Add a markdown note to the project.",
      inputSchema: {
        title: z.string().trim().min(1).max(300),
        body: z.string(),
      },
    },
    async (input) => ok((await createNote(projectId, input)).note),
  );

  server.registerTool(
    "list_milestones",
    { description: "List the project's milestones ordered by date." },
    async () => ok(await listMcpMilestones(projectId)),
  );

  server.registerTool(
    "list_secrets",
    {
      description:
        "List the project's secret names and descriptions. Values are never exposed over MCP.",
    },
    async () => ok((await listSecrets(projectId)).secrets),
  );

  return server;
}
