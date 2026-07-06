import type { InferRequestType } from "@repo/api-client";
import { apiClient } from "../../lib/api";

const secretsClient = apiClient.projects[":projectId"].secrets;

export type CreateSecretInput = InferRequestType<typeof secretsClient.$post>["json"];

export class DuplicateSecretNameError extends Error {
  constructor() {
    super("A secret with this name already exists.");
    this.name = "DuplicateSecretNameError";
  }
}

export async function createSecret(projectId: string, input: CreateSecretInput) {
  const response = await secretsClient.$post({ param: { projectId }, json: input });

  if (response.status === 409) {
    throw new DuplicateSecretNameError();
  }

  if (!response.ok) {
    throw new Error("Failed to create the secret.");
  }

  return (await response.json()).secret;
}

export async function revealSecret(projectId: string, secretId: string) {
  const response = await secretsClient[":secretId"].reveal.$post({
    param: { projectId, secretId },
  });

  if (!response.ok) {
    throw new Error("Failed to reveal the secret.");
  }

  return (await response.json()).value;
}

export async function deleteSecret(projectId: string, secretId: string) {
  const response = await secretsClient[":secretId"].$delete({ param: { projectId, secretId } });

  if (!response.ok) {
    throw new Error("Failed to delete the secret.");
  }

  return response.json();
}
