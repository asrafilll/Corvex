import { hc } from "hono/client";
import type { AppType } from "@repo/api";

export type { InferRequestType, InferResponseType } from "hono/client";

export function createApiClient(baseUrl: string) {
  return hc<AppType>(baseUrl, {
    init: {
      credentials: "include",
    },
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;

export type UnlockInput = {
  password: string;
};

export class UnauthorizedApiError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedApiError";
  }
}

export class AppUnlockApiError extends Error {
  constructor(public readonly code: "incorrect_password" | "too_many_attempts") {
    super(code);
    this.name = "AppUnlockApiError";
  }
}

export async function fetchAppSession(client: ApiClient) {
  const response = await client.auth.session.$get();

  if (response.status === 401) {
    throw new UnauthorizedApiError();
  }

  if (!response.ok) {
    throw new Error("Failed to load the app session.");
  }

  return response.json();
}

export async function unlockApp(client: ApiClient, input: UnlockInput) {
  const response = await client.auth.unlock.$post({
    json: input,
  });

  if (response.status === 401) {
    throw new AppUnlockApiError("incorrect_password");
  }

  if (response.status === 429) {
    throw new AppUnlockApiError("too_many_attempts");
  }

  if (!response.ok) {
    throw new Error("Failed to unlock Corvex.");
  }

  return response.json();
}

export async function lockApp(client: ApiClient) {
  const response = await client.auth.lock.$post();

  if (!response.ok) {
    throw new Error("Failed to lock Corvex.");
  }

  return response.json();
}
