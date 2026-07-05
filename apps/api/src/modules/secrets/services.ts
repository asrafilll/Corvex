import { decryptSecret, encryptSecret } from "../../utils/secret-crypto";
import { Prisma, prisma } from "../../utils/prisma";
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

export async function createSecret(projectId: string, input: CreateSecretInput) {
  const { value, ...data } = input;

  try {
    return {
      secret: await prisma.secret.create({
        data: { ...data, encryptedValue: encryptSecret(value), projectId },
        select: secretSelect,
      }),
    };
  } catch (error) {
    throw translateUniqueConstraintError(error);
  }
}

export async function updateSecret(secretId: string, input: UpdateSecretInput) {
  const { value, ...data } = input;

  try {
    return {
      secret: await prisma.secret.update({
        where: { id: secretId },
        data: {
          ...data,
          encryptedValue: value === undefined ? undefined : encryptSecret(value),
        },
        select: secretSelect,
      }),
    };
  } catch (error) {
    throw translateUniqueConstraintError(error);
  }
}

export async function deleteSecret(secretId: string) {
  await prisma.secret.delete({ where: { id: secretId } });

  return { ok: true };
}

export async function revealSecret(projectId: string, secretId: string) {
  const secret = await prisma.secret.findFirst({
    where: { id: secretId, projectId },
    select: { id: true, encryptedValue: true },
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
