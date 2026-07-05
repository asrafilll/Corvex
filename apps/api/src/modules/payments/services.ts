import { Prisma, prisma } from "../../utils/prisma";
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

export async function createPayment(projectId: string, input: CreatePaymentInput) {
  return {
    payment: serializePayment(
      await prisma.payment.create({
        data: { ...input, amount: new Prisma.Decimal(input.amount), projectId },
      }),
    ),
  };
}

export async function updatePayment(paymentId: string, input: UpdatePaymentInput) {
  const { amount, ...data } = input;

  return {
    payment: serializePayment(
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          ...data,
          amount: amount === undefined ? undefined : new Prisma.Decimal(amount),
        },
      }),
    ),
  };
}

export async function deletePayment(paymentId: string) {
  await prisma.payment.delete({ where: { id: paymentId } });

  return { ok: true };
}

function serializePayment<T extends { amount: Prisma.Decimal }>(payment: T) {
  return {
    ...payment,
    amount: payment.amount.toString(),
  };
}
