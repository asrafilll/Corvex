import { createFileRoute, redirect } from "@tanstack/react-router";
import { appSessionQueryOptions } from "../modules/auth/hooks/use-auth";
import { UnauthorizedError } from "../modules/auth/services";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(appSessionQueryOptions);
      throw redirect({ to: "/projects" });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw redirect({ to: "/login" });
      }

      throw error;
    }
  },
});
