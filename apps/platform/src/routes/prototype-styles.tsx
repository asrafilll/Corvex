// PROTOTYPE — chosen "Variant A — Linear Dense" preview, kept for screenshots. Throwaway.
import { createFileRoute, redirect } from "@tanstack/react-router";
import { appSessionQueryOptions } from "../modules/auth/hooks/use-auth";
import { UnauthorizedError } from "../modules/auth/services";
import { VariantALinear } from "../modules/style-prototype/variant-a-linear";

export const Route = createFileRoute("/prototype-styles")({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(appSessionQueryOptions);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw redirect({ to: "/login" });
      }

      throw error;
    }
  },
  component: VariantALinear,
});
