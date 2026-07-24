import { Prisma, prisma } from "../../utils/prisma";
import type { ActivityActor } from "../activities/services";
import { withProjectActivity } from "../activities/services";
import type { CreatePaymentInput, UpdatePaymentInput } from "./schema";

export async function listPayments(projectId: string) {
  const payments = await prisma.payment.findMany({
    where: { projectId },
    orderBy: [{ date: "asc" }, { id: "asc" }],
  });

  return { payments: payments.map(serializePayment) };
}

export async function findPaymentOrNull(projectId: string, paymentId: string) {
  return prisma.payment.findFirst({
    where: { id: paymentId, projectId },
    select: { id: true },
  });
}

export async function createPayment(
  projectId: string,
  input: CreatePaymentInput,
  actor: ActivityActor,
) {
  return withProjectActivity(
    actor,
    async (transaction) => ({
      payment: serializePayment(
        await transaction.payment.create({
          data: { ...input, amount: new Prisma.Decimal(input.amount), projectId },
        }),
      ),
    }),
    ({ payment }) => ({
      action: "Created",
      entityId: payment.id,
      entityLabel: "Payment",
      entityType: "Payment",
      projectId,
    }),
  );
}

export async function updatePayment(
  projectId: string,
  paymentId: string,
  input: UpdatePaymentInput,
  actor: ActivityActor,
) {
  const { amount, ...data } = input;

  return withProjectActivity(
    actor,
    async (transaction) => ({
      payment: serializePayment(
        await transaction.payment.update({
          where: { id: paymentId },
          data: {
            ...data,
            amount: amount === undefined ? undefined : new Prisma.Decimal(amount),
          },
        }),
      ),
    }),
    ({ payment }) => ({
      action: "Updated",
      entityId: payment.id,
      entityLabel: "Payment",
      entityType: "Payment",
      projectId,
    }),
  );
}

export async function deletePayment(projectId: string, paymentId: string, actor: ActivityActor) {
  await withProjectActivity(
    actor,
    (transaction) => transaction.payment.delete({ where: { id: paymentId } }),
    (payment) => ({
      action: "Deleted",
      entityId: payment.id,
      entityLabel: "Payment",
      entityType: "Payment",
      projectId,
    }),
  );

  return { ok: true };
}

function serializePayment<T extends { amount: Prisma.Decimal }>(payment: T) {
  return {
    ...payment,
    amount: payment.amount.toString(),
  };
}
