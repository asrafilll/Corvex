export const baseDate = new Date("2026-07-03T00:00:00.000Z");

export function createAuthSession(role = "user") {
  return {
    session: {
      createdAt: baseDate,
      expiresAt: baseDate,
      id: "session-id",
      token: "session-token",
      updatedAt: baseDate,
      userId: "auth-user-id",
    },
    user: {
      createdAt: baseDate,
      email: "user@example.com",
      emailVerified: true,
      id: "auth-user-id",
      image: null,
      name: "Test User",
      role,
      updatedAt: baseDate,
    },
  };
}
