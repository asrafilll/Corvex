import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app";
import { baseDate, createTransactionMock } from "../../test/helpers";

const mocks = vi.hoisted(() => ({
  readAppSession: vi.fn(),
  paymentCreate: vi.fn(),
  paymentDelete: vi.fn(),
  paymentFindFirst: vi.fn(),
  paymentFindMany: vi.fn(),
  paymentUpdate: vi.fn(),
  projectFindUnique: vi.fn(),
  activityCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../auth/auth", () => ({
  readAppSession: mocks.readAppSession,
}));

vi.mock("../../utils/prisma", () => ({
  Prisma,
  prisma: {
    activity: { create: mocks.activityCreate },
    payment: {
      create: mocks.paymentCreate,
      delete: mocks.paymentDelete,
      findFirst: mocks.paymentFindFirst,
      findMany: mocks.paymentFindMany,
      update: mocks.paymentUpdate,
    },
    project: {
      findUnique: mocks.projectFindUnique,
    },
    $transaction: mocks.transaction,
  },
}));

describe("payments router", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }

    mocks.readAppSession.mockResolvedValue(true);
    mocks.paymentCreate.mockImplementation(({ data }) => Promise.resolve(createPayment(data)));
    mocks.paymentDelete.mockResolvedValue(createPayment());
    mocks.paymentFindFirst.mockResolvedValue(null);
    mocks.paymentFindMany.mockResolvedValue([]);
    mocks.paymentUpdate.mockImplementation(({ data, where }) =>
      Promise.resolve(createPayment({ id: where.id, ...data })),
    );
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1" });
    mocks.activityCreate.mockImplementation(({ data }) =>
      Promise.resolve({ id: "activity-1", ...data }),
    );
    mocks.transaction.mockImplementation(
      createTransactionMock({
        activity: { create: mocks.activityCreate },
        payment: {
          create: mocks.paymentCreate,
          delete: mocks.paymentDelete,
          update: mocks.paymentUpdate,
        },
      }),
    );
  });

  it("returns unauthorized without a session", async () => {
    mocks.readAppSession.mockResolvedValue(null);

    const response = await app.request("/projects/project-1/payments");

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(mocks.paymentFindMany).not.toHaveBeenCalled();
  });

  it("lists payments with string amounts ordered by date", async () => {
    mocks.paymentFindMany.mockResolvedValue([
      createPayment({ id: "payment-1", amount: new Prisma.Decimal("1500.5") }),
    ]);

    const response = await app.request("/projects/project-1/payments");

    await expect(response.json()).resolves.toEqual({
      payments: [
        {
          amount: "1500.5",
          date: baseDate.toISOString(),
          id: "payment-1",
          note: null,
          projectId: "project-1",
        },
      ],
    });
    expect(response.status).toBe(200);
    expect(mocks.paymentFindMany).toHaveBeenCalledWith({
      where: { projectId: "project-1" },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    });
  });

  it("creates a payment converting the amount to a Decimal", async () => {
    const response = await app.request("/projects/project-1/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: baseDate.toISOString(), amount: 250.75, note: "Deposit" }),
    });

    await expect(response.json()).resolves.toEqual({
      payment: {
        amount: "250.75",
        date: baseDate.toISOString(),
        id: "payment-1",
        note: "Deposit",
        projectId: "project-1",
      },
    });
    expect(response.status).toBe(201);

    const data = mocks.paymentCreate.mock.calls[0]?.[0].data;
    expect(data.amount).toBeInstanceOf(Prisma.Decimal);
    expect(data.amount.toString()).toBe("250.75");
    expect(data.projectId).toBe("project-1");
    expect(JSON.stringify(mocks.activityCreate.mock.calls[0]?.[0].data)).not.toContain("250.75");
  });

  it("rejects malformed amounts", async () => {
    const response = await app.request("/projects/project-1/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: baseDate.toISOString(), amount: "12.345" }),
    });

    expect(response.status).toBe(400);
    expect(mocks.paymentCreate).not.toHaveBeenCalled();
  });

  it("returns not_found when creating on a missing project", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);

    const response = await app.request("/projects/missing/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: baseDate.toISOString(), amount: "100" }),
    });

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
    expect(mocks.paymentCreate).not.toHaveBeenCalled();
  });

  it("updates a payment amount", async () => {
    mocks.paymentFindFirst.mockResolvedValue({ id: "payment-1" });

    const response = await app.request("/projects/project-1/payments/payment-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "300" }),
    });

    await expect(response.json()).resolves.toMatchObject({
      payment: { amount: "300", id: "payment-1" },
    });
    expect(response.status).toBe(200);

    const update = mocks.paymentUpdate.mock.calls[0]?.[0];
    expect(update.where).toEqual({ id: "payment-1" });
    expect(update.data.amount).toBeInstanceOf(Prisma.Decimal);
    expect(update.data.amount.toString()).toBe("300");
  });

  it("returns not_found for cross-project payment access", async () => {
    const response = await app.request("/projects/project-2/payments/payment-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "300" }),
    });

    await expect(response.json()).resolves.toEqual({ error: "not_found" });
    expect(response.status).toBe(404);
    expect(mocks.paymentUpdate).not.toHaveBeenCalled();
    expect(mocks.paymentFindFirst).toHaveBeenCalledWith({
      where: { id: "payment-1", projectId: "project-2" },
      select: { id: true },
    });
  });

  it("deletes a payment", async () => {
    mocks.paymentFindFirst.mockResolvedValue({ id: "payment-1" });

    const response = await app.request("/projects/project-1/payments/payment-1", {
      method: "DELETE",
    });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.paymentDelete).toHaveBeenCalledWith({ where: { id: "payment-1" } });
  });
});

function createPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: "payment-1",
    date: baseDate,
    amount: new Prisma.Decimal("100"),
    note: null,
    projectId: "project-1",
    ...overrides,
  };
}
