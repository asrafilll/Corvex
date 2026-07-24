import type { Prisma } from "../../utils/prisma";
import { prisma } from "../../utils/prisma";

export type ActivityActor =
  | { actorType: "App" }
  | { actorType: "Mcp"; actorLabel: string; mcpTokenId: string };

export type ActivityEvent = {
  action: "Created" | "Updated" | "Deleted" | "Reordered" | "Revealed" | "Revoked";
  entityId?: string | null;
  entityLabel: string;
  entityType: "Project" | "Task" | "Milestone" | "Payment" | "Note" | "Secret" | "McpToken";
  projectId: string;
};

export const appActivityActor = { actorType: "App" } as const satisfies ActivityActor;

export function mcpActivityActor(mcpTokenId: string, actorLabel: string): ActivityActor {
  return { actorType: "Mcp", actorLabel, mcpTokenId };
}

export async function withProjectActivity<T>(
  actor: ActivityActor,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  describe: (result: T) => ActivityEvent,
) {
  return prisma.$transaction(async (transaction) => {
    const result = await operation(transaction);
    await recordProjectActivity(transaction, actor, describe(result));

    return result;
  });
}

export async function recordProjectActivity(
  transaction: Prisma.TransactionClient,
  actor: ActivityActor,
  event: ActivityEvent,
) {
  await transaction.activity.create({
    data: {
      ...event,
      actorType: actor.actorType,
      actorLabel: actor.actorType === "Mcp" ? actor.actorLabel : null,
      mcpTokenId: actor.actorType === "Mcp" ? actor.mcpTokenId : null,
    },
  });
}

export async function listActivities(projectId: string, limit: number) {
  return {
    activities: await prisma.activity.findMany({
      where: { projectId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
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
    }),
  };
}
