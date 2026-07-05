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

export type UpdateProfileInput = {
  image?: string | null;
  name: string;
};

export class UnauthorizedApiError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedApiError";
  }
}

export async function fetchSessionUser(client: ApiClient) {
  const response = await client.session.$get();

  if (response.status === 401) {
    throw new UnauthorizedApiError();
  }

  if (!response.ok) {
    throw new Error("Failed to load current user.");
  }

  const data = await response.json();

  return data.user;
}

export async function updateCurrentUserProfile(client: ApiClient, input: UpdateProfileInput) {
  const response = await client.profile.$patch({
    json: input,
  });

  if (response.status === 401) {
    throw new UnauthorizedApiError();
  }

  if (!response.ok) {
    throw new Error("Failed to update profile.");
  }

  const data = await response.json();

  return data.user;
}
