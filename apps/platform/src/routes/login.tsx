import { useTranslation } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/sonner";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowRightIcon, KeyRoundIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { appSessionQueryOptions, useUnlockMutation } from "../modules/auth/hooks/use-auth";
import { UnauthorizedError, UnlockError } from "../modules/auth/services";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(appSessionQueryOptions);
      throw redirect({ to: "/projects" });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return;
      }

      throw error;
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const unlockMutation = useUnlockMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    unlockMutation.mutate(
      { password },
      {
        onError: (error) => {
          const message =
            error instanceof UnlockError
              ? t(`auth.unlock.errors.${error.code}`)
              : t("auth.unlock.errors.fallback");
          toast.error(message);
        },
      },
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-white px-6 text-foreground sm:px-8">
      <header className="mx-auto flex w-full max-w-5xl items-center py-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-foreground bg-highlight text-base font-bold text-highlight-foreground shadow-xs">
            C
          </span>
          <span className="text-xl font-bold tracking-tight">{t("nav.brand")}</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center py-12 sm:py-16">
        <section className="w-full max-w-md">
          <span className="mb-6 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <KeyRoundIcon className="size-5" strokeWidth={2.2} />
          </span>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("auth.unlock.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("auth.unlock.title")}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {t("auth.unlock.description")}
          </p>

          <Card className="mt-8 w-full border-foreground bg-white shadow-md">
            <CardContent className="pt-6">
              <form className="grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-2.5">
                  <Label htmlFor="password" className="text-sm font-semibold">
                    {t("auth.unlock.password")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 bg-white px-3.5 text-base"
                  />
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  disabled={unlockMutation.isPending || password.length === 0}
                  className="h-12 justify-between text-base font-semibold"
                >
                  {unlockMutation.isPending ? t("auth.unlock.pending") : t("auth.unlock.submit")}
                  <ArrowRightIcon className="size-4" strokeWidth={2.2} />
                </Button>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                  {t("auth.unlock.sessionNote")}
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
