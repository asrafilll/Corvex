import { useMutation } from "@tanstack/react-query";
import { useInvalidateProjects } from "../../projects/hooks/use-projects";
import { type CreatePaymentInput, createPayment, deletePayment } from "../services";

export function useCreatePaymentMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (input: CreatePaymentInput) => createPayment(projectId, input),
    onSuccess: invalidate,
  });
}

export function useDeletePaymentMutation(projectId: string) {
  const invalidate = useInvalidateProjects();

  return useMutation({
    mutationFn: (paymentId: string) => deletePayment(projectId, paymentId),
    onSuccess: invalidate,
  });
}
