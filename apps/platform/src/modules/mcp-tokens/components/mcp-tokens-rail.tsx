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
import { cn } from "@repo/ui/lib/utils";
import { CopyIcon, PlusIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { formatDate } from "../../../lib/format";
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("projectDetail.tokens.title")} <span className="font-normal">{mcpTokens.length}</span>
        </h3>
        <CreateTokenDialog projectId={projectId} />
      </div>
      {mcpTokens.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {mcpTokens.map((token) => (
            <li key={token.id} className="flex items-center gap-2">
              <span
                className={cn(
                  "min-w-0 flex-1 truncate",
                  token.revoked && "text-muted-foreground line-through",
                )}
              >
                {token.name}
              </span>
              <span className="text-muted-foreground">{formatDate(token.createdAt)}</span>
              {token.revoked ? (
                <span className="text-muted-foreground">{t("projectDetail.tokens.revoked")}</span>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-destructive">
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
          ))}
        </ul>
      ) : null}
    </div>
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
        <Button type="button" size="icon" variant="ghost" className="size-6">
          <PlusIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("projectDetail.tokens.addTitle")}</DialogTitle>
          <DialogDescription>{t("projectDetail.tokens.addDescription")}</DialogDescription>
        </DialogHeader>
        {rawToken ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
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
