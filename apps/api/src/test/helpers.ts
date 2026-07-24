export const baseDate = new Date("2026-07-03T00:00:00.000Z");

export function createTransactionMock(client: unknown) {
  return async (input: unknown) => {
    if (typeof input === "function") {
      return input(client);
    }

    if (Array.isArray(input)) {
      return Promise.all(input);
    }

    throw new TypeError("Unsupported Prisma transaction mock input.");
  };
}
