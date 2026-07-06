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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Field, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/sonner";
import { CopyIcon, EyeIcon, EyeOffIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import type { ProjectDetail } from "../../projects/services";
import {
  useCreateSecretMutation,
  useDeleteSecretMutation,
  useRevealSecretMutation,
} from "../hooks/use-secrets";
import { DuplicateSecretNameError } from "../services";

type Detail = NonNullable<ProjectDetail>;
type Secret = Detail["secrets"][number];

const rehideMs = 30_000;

export function SecretsRail({ projectId, secrets }: { projectId: string; secrets: Secret[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("projectDetail.secrets.title")} <span className="font-normal">{secrets.length}</span>
        </h3>
        <CreateSecretDialog projectId={projectId} />
      </div>
      {secrets.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {secrets.map((secret) => (
            <SecretRow key={secret.id} projectId={projectId} secret={secret} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SecretRow({ projectId, secret }: { projectId: string; secret: Secret }) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState<string | null>(null);
  const rehideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const revealSecretMutation = useRevealSecretMutation(projectId);
  const deleteSecretMutation = useDeleteSecretMutation(projectId);

  useEffect(() => () => clearTimeout(rehideTimer.current), []);

  function hide() {
    clearTimeout(rehideTimer.current);
    setRevealed(null);
  }

  function toggleReveal() {
    if (revealed !== null) {
      hide();
      return;
    }

    revealSecretMutation.mutate(secret.id, {
      onError: (error) =>
        toast.error(
          error instanceof Error ? error.message : t("projectDetail.secrets.fallbackError"),
        ),
      onSuccess: (value) => {
        setRevealed(value);
        clearTimeout(rehideTimer.current);
        rehideTimer.current = setTimeout(hide, rehideMs);
      },
    });
  }

  async function copyValue() {
    if (revealed === null) {
      return;
    }

    // Never toast the value itself — only confirm the copy happened.
    await navigator.clipboard.writeText(revealed);
    toast.success(t("projectDetail.secrets.copied"));
  }

  return (
    <li className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{secret.name}</span>
        <button
          type="button"
          aria-label={t("projectDetail.secrets.reveal")}
          className="text-muted-foreground hover:text-foreground"
          onClick={toggleReveal}
          disabled={revealSecretMutation.isPending}
        >
          {revealed !== null ? (
            <EyeOffIcon className="size-3.5" />
          ) : (
            <EyeIcon className="size-3.5" />
          )}
        </button>
        {revealed !== null ? (
          <button
            type="button"
            aria-label={t("projectDetail.secrets.copy")}
            className="text-muted-foreground hover:text-foreground"
            onClick={copyValue}
          >
            <CopyIcon className="size-3.5" />
          </button>
        ) : null}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              aria-label={t("projectDetail.secrets.delete")}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("projectDetail.secrets.deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("projectDetail.secrets.deleteBody", { name: secret.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("projectDetail.secrets.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteSecretMutation.mutate(secret.id, {
                    onError: (error) =>
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : t("projectDetail.secrets.fallbackError"),
                      ),
                  })
                }
              >
                {t("projectDetail.secrets.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <code className="truncate font-mono text-muted-foreground">{revealed ?? "••••••••"}</code>
      {secret.description ? (
        <span className="truncate text-muted-foreground">{secret.description}</span>
      ) : null}
    </li>
  );
}

function CreateSecretDialog({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const createSecretMutation = useCreateSecretMutation(projectId);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setName("");
      setDescription("");
      setValue("");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !value) {
      return;
    }

    createSecretMutation.mutate(
      { name: name.trim(), description: description.trim() || null, value },
      {
        onError: (error) => {
          if (error instanceof DuplicateSecretNameError) {
            toast.error(t("projectDetail.secrets.duplicate"));
            return;
          }

          toast.error(
            error instanceof Error ? error.message : t("projectDetail.secrets.fallbackError"),
          );
        },
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="icon" variant="ghost" className="size-6">
          <PlusIcon className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("projectDetail.secrets.addTitle")}</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="secret-name">{t("projectDetail.secrets.name")}</FieldLabel>
            <Input
              id="secret-name"
              value={name}
              required
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="secret-description">
              {t("projectDetail.secrets.description")}
            </FieldLabel>
            <Input
              id="secret-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="secret-value">{t("projectDetail.secrets.value")}</FieldLabel>
            <Input
              id="secret-value"
              type="password"
              value={value}
              required
              autoComplete="off"
              onChange={(event) => setValue(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={createSecretMutation.isPending}>
              {createSecretMutation.isPending
                ? t("projectDetail.secrets.saving")
                : t("projectDetail.secrets.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
