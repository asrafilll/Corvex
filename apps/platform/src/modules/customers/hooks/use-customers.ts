import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  type UpdateCustomerInput,
  updateCustomer,
} from "../services";

export const customersQueryKey = ["customers"] as const;

export const customersQueryOptions = queryOptions({
  queryKey: [...customersQueryKey, "list"],
  queryFn: listCustomers,
});

export function customerQueryOptions(customerId: string) {
  return queryOptions({
    queryKey: [...customersQueryKey, customerId],
    queryFn: () => getCustomer(customerId),
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customersQueryKey });
    },
  });
}

export function useUpdateCustomerMutation(customerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => updateCustomer(customerId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customersQueryKey });
    },
  });
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customersQueryKey });
    },
  });
}
