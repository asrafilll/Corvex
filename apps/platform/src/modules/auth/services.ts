import {
  AppUnlockApiError,
  createApiClient,
  fetchAppSession,
  lockApp,
  UnauthorizedApiError,
  unlockApp,
} from "@repo/api-client";
import type { AppSession, UnlockInput } from "./types";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const apiClient = createApiClient(apiBaseUrl);

export { AppUnlockApiError as UnlockError, UnauthorizedApiError as UnauthorizedError };

export async function getAppSession() {
  return (await fetchAppSession(apiClient)) as AppSession;
}

export async function unlock(input: UnlockInput) {
  return (await unlockApp(apiClient, input)) as AppSession;
}

export function lock() {
  return lockApp(apiClient);
}
