import { decryptSecret, encryptSecret } from "../../utils/secret-crypto";
import { Prisma, prisma } from "../../utils/prisma";
import type { ActivityActor } from "../activities/services";
import { recordProjectActivity, withProjectActivity } from "../activities/services";
import type { CreateSecretInput, UpdateSecretInput } from "./schema";

export class DuplicateSecretNameError extends Error {
  constructor() {
    super("A Secret with this name already exists in the Project.");
    this.name = "DuplicateSecretNameError";
  }
}

// ADR-0001: encryptedValue must never leave the reveal endpoint.
const secretSelect = {
  id: true,
  name: true,
  description: true,
} as const;

export async function listSecrets(projectId: string) {
  return {
    secrets: await prisma.secret.findMany({
      where: { projectId },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: secretSelect,
    }),
  };
}

export async function findSecretOrNull(projectId: string, secretId: string) {
  return prisma.secret.findFirst({
    where: { id: secretId, projectId },
    select: { id: true },
  });
}

export async function createSecret(
  projectId: string,
  input: CreateSecretInput,
  actor: ActivityActor,
) {
  const { value, ...data } = input;

  try {
    return await withProjectActivity(
      actor,
      async (transaction) => ({
        secret: await transaction.secret.create({
          data: { ...data, encryptedValue: encryptSecret(value), projectId },
          select: secretSelect,
        }),
      }),
      ({ secret }) => ({
        action: "Created",
        entityId: secret.id,
        entityLabel: secret.name,
        entityType: "Secret",
        projectId,
      }),
    );
  } catch (error) {
    throw translateUniqueConstraintError(error);
  }
}

export async function updateSecret(
  projectId: string,
  secretId: string,
  input: UpdateSecretInput,
  actor: ActivityActor,
) {
  const { value, ...data } = input;

  try {
    return await withProjectActivity(
      actor,
      async (transaction) => ({
        secret: await transaction.secret.update({
          where: { id: secretId },
          data: {
            ...data,
            encryptedValue: value === undefined ? undefined : encryptSecret(value),
          },
          select: secretSelect,
        }),
      }),
      ({ secret }) => ({
        action: "Updated",
        entityId: secret.id,
        entityLabel: secret.name,
        entityType: "Secret",
        projectId,
      }),
    );
  } catch (error) {
    throw translateUniqueConstraintError(error);
  }
}

export async function deleteSecret(projectId: string, secretId: string, actor: ActivityActor) {
  await withProjectActivity(
    actor,
    (transaction) => transaction.secret.delete({ where: { id: secretId }, select: secretSelect }),
    (secret) => ({
      action: "Deleted",
      entityId: secret.id,
      entityLabel: secret.name,
      entityType: "Secret",
      projectId,
    }),
  );

  return { ok: true };
}

export async function revealSecret(projectId: string, secretId: string, actor: ActivityActor) {
  const secret = await prisma.$transaction(async (transaction) => {
    const record = await transaction.secret.findFirst({
      where: { id: secretId, projectId },
      select: { id: true, name: true, encryptedValue: true },
    });

    if (!record) {
      return null;
    }

    await recordProjectActivity(transaction, actor, {
      action: "Revealed",
      entityId: record.id,
      entityLabel: record.name,
      entityType: "Secret",
      projectId,
    });

    return record;
  });

  if (!secret) {
    return null;
  }

  return { value: decryptSecret(secret.encryptedValue) };
}

function translateUniqueConstraintError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return new DuplicateSecretNameError();
  }

  return error;
}
