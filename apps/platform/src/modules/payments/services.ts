import type { InferRequestType } from "@repo/api-client";
import { apiClient } from "../../lib/api";

const paymentsClient = apiClient.projects[":projectId"].payments;

export type CreatePaymentInput = InferRequestType<typeof paymentsClient.$post>["json"];

export async function createPayment(projectId: string, input: CreatePaymentInput) {
  const response = await paymentsClient.$post({ param: { projectId }, json: input });

  if (!response.ok) {
    throw new Error("Failed to record the payment.");
  }

  return (await response.json()).payment;
}

export async function deletePayment(projectId: string, paymentId: string) {
  const response = await paymentsClient[":paymentId"].$delete({
    param: { projectId, paymentId },
  });

  if (!response.ok) {
    throw new Error("Failed to delete the payment.");
  }

  return response.json();
}
