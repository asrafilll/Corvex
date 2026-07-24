CREATE TYPE "ActivityActorType" AS ENUM ('App', 'Mcp');

CREATE TYPE "ActivityAction" AS ENUM ('Created', 'Updated', 'Deleted', 'Reordered', 'Revealed', 'Revoked');

CREATE TYPE "ActivityEntityType" AS ENUM ('Project', 'Task', 'Milestone', 'Payment', 'Note', 'Secret', 'McpToken');

CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorType" "ActivityActorType" NOT NULL,
    "actorLabel" TEXT,
    "mcpTokenId" TEXT,
    "action" "ActivityAction" NOT NULL,
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT,
    "entityLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Activity_projectId_createdAt_idx" ON "Activity"("projectId", "createdAt");

CREATE INDEX "Activity_mcpTokenId_createdAt_idx" ON "Activity"("mcpTokenId", "createdAt");

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_mcpTokenId_fkey" FOREIGN KEY ("mcpTokenId") REFERENCES "McpToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
