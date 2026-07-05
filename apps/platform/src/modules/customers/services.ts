import type { InferRequestType } from "@repo/api-client";
import { apiClient } from "../../lib/api";

export type CreateCustomerInput = InferRequestType<typeof apiClient.customers.$post>["json"];
export type UpdateCustomerInput = InferRequestType<
  (typeof apiClient.customers)[":customerId"]["$patch"]
>["json"];

export async function listCustomers() {
  const response = await apiClient.customers.$get();

  if (!response.ok) {
    throw new Error("Failed to load customers.");
  }

  return (await response.json()).customers;
}

export async function getCustomer(customerId: string) {
  const response = await apiClient.customers[":customerId"].$get({
    param: { customerId },
  });

  if (!response.ok) {
    throw new Error("Failed to load the customer.");
  }

  return (await response.json()).customer;
}

export async function createCustomer(input: CreateCustomerInput) {
  const response = await apiClient.customers.$post({ json: input });

  if (!response.ok) {
    throw new Error("Failed to create the customer.");
  }

  return (await response.json()).customer;
}

export async function updateCustomer(customerId: string, input: UpdateCustomerInput) {
  const response = await apiClient.customers[":customerId"].$patch({
    param: { customerId },
    json: input,
  });

  if (!response.ok) {
    throw new Error("Failed to update the customer.");
  }

  return (await response.json()).customer;
}

export async function deleteCustomer(customerId: string) {
  const response = await apiClient.customers[":customerId"].$delete({
    param: { customerId },
  });

  if (!response.ok) {
    throw new Error("Failed to delete the customer.");
  }

  return response.json();
}
