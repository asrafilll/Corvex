import { useTranslation } from "@repo/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Field, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/sonner";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@repo/ui/lib/utils";
import { CopyIcon, PlusIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { formatDate, formatDateTime } from "../../../lib/format";
import { activitiesQueryOptions } from "../../activities/hooks/use-activities";
import type { ProjectDetail } from "../../projects/services";
import { useCreateMcpTokenMutation, useRevokeMcpTokenMutation } from "../hooks/use-mcp-tokens";

type Detail = NonNullable<ProjectDetail>;
type McpToken = Detail["mcpTokens"][number];

export function McpTokensRail({
  projectId,
  mcpTokens,
}: {
  projectId: string;
  mcpTokens: McpToken[];
}) {
  const { t } = useTranslation();
  const revokeMcpTokenMutation = useRevokeMcpTokenMutation(projectId);
  const activities = useQuery(activitiesQueryOptions(projectId));

  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{t("projectDetail.tokens.title")}</h2>
          <span className="rounded-sm bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
            {mcpTokens.length}
          </span>
        </div>
        <CreateTokenDialog projectId={projectId} />
      </div>
      {mcpTokens.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {mcpTokens.map((token) => {
            const lastAction = activities.data?.find(
              (activity) => activity.actorType === "Mcp" && activity.mcpTokenId === token.id,
            );

            return (
              <li
                key={token.id}
                className="flex min-h-16 items-center gap-4 rounded-xl bg-muted/60 px-4 py-3"
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-base font-semibold",
                      token.revoked && "text-muted-foreground line-through",
                    )}
                  >
                    {token.name}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                    {lastAction
                      ? t("projectDetail.tokens.lastAction", {
                          action: t(`projectDetail.activity.actions.${lastAction.action}`),
                          entity: t(
                            `projectDetail.activity.entities.${lastAction.entityType}`,
                          ).toLowerCase(),
                          label: lastAction.entityLabel,
                          date: formatDateTime(lastAction.createdAt),
                        })
                      : t("projectDetail.tokens.noActivity")}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {t("projectDetail.tokens.created", { date: formatDate(token.createdAt) })}
                </span>
                {token.revoked ? (
                  <span className="text-muted-foreground">{t("projectDetail.tokens.revoked")}</span>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {t("projectDetail.tokens.revoke")}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("projectDetail.tokens.revokeTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("projectDetail.tokens.revokeBody", { name: token.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("projectDetail.tokens.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            revokeMcpTokenMutation.mutate(token.id, {
                              onError: (error) =>
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : t("projectDetail.tokens.fallbackError"),
                                ),
                            })
                          }
                        >
                          {t("projectDetail.tokens.revoke")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl bg-muted/60 px-4 py-8 text-base text-muted-foreground">
          {t("projectDetail.tokens.empty")}
        </p>
      )}
    </section>
  );
}

function CreateTokenDialog({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rawToken, setRawToken] = useState<string | null>(null);
  const createMcpTokenMutation = useCreateMcpTokenMutation(projectId);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setName("");
      setRawToken(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    createMcpTokenMutation.mutate(
      { name: name.trim() },
      {
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("projectDetail.tokens.fallbackError"),
          ),
        onSuccess: (result) => setRawToken(result.token),
      },
    );
  }

  async function copyToken() {
    if (!rawToken) {
      return;
    }

    await navigator.clipboard.writeText(rawToken);
    toast.success(t("projectDetail.tokens.copied"));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" className="h-11 px-4 text-base">
          <PlusIcon className="size-4" />
          {t("projectDetail.tokens.addTitle")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("projectDetail.tokens.addTitle")}</DialogTitle>
          <DialogDescription>{t("projectDetail.tokens.addDescription")}</DialogDescription>
        </DialogHeader>
        {rawToken ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">
              {t("projectDetail.tokens.onceWarning")}
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-md border bg-muted px-2 py-1.5 font-mono text-xs">
                {rawToken}
              </code>
              <Button type="button" size="icon" variant="outline" onClick={copyToken}>
                <CopyIcon className="size-4" />
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                {t("projectDetail.tokens.done")}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="token-name">{t("projectDetail.tokens.name")}</FieldLabel>
              <Input
                id="token-name"
                value={name}
                required
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={createMcpTokenMutation.isPending}>
                {createMcpTokenMutation.isPending
                  ? t("projectDetail.tokens.creating")
                  : t("projectDetail.tokens.create")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
