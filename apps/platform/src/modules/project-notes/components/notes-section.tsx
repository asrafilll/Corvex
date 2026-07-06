import { useTranslation } from "@repo/i18n";
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
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/sonner";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDate } from "../../../lib/format";
import type { ProjectDetail } from "../../projects/services";
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useUpdateNoteMutation,
} from "../hooks/use-project-notes";

type Note = NonNullable<ProjectDetail>["notes"][number];

export function NotesSection({ projectId, notes }: { projectId: string; notes: Note[] }) {
  const { t } = useTranslation();
  const deleteNoteMutation = useDeleteNoteMutation(projectId);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("projectDetail.notes.title")} <span className="font-normal">{notes.length}</span>
        </h2>
        <NoteDialog
          projectId={projectId}
          trigger={
            <Button type="button" size="sm" variant="ghost">
              <PlusIcon className="size-4" />
              {t("projectDetail.notes.add")}
            </Button>
          }
        />
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("projectDetail.notes.empty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <article key={note.id} className="rounded-md border px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium">{note.title}</h3>
                  <p className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</p>
                </div>
                <div className="flex shrink-0 items-center">
                  <NoteDialog
                    projectId={projectId}
                    note={note}
                    trigger={
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label={t("projectDetail.notes.edit")}
                      >
                        <PencilIcon className="size-3.5" />
                      </Button>
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    aria-label={t("projectDetail.notes.delete")}
                    onClick={() =>
                      deleteNoteMutation.mutate(note.id, {
                        onError: (error) =>
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : t("projectDetail.notes.fallbackError"),
                          ),
                      })
                    }
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h1]:mt-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mt-2 [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-2 [&_table]:w-full [&_th]:border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
                <Markdown remarkPlugins={[remarkGfm]}>{note.body}</Markdown>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function NoteDialog({
  projectId,
  note,
  trigger,
}: {
  projectId: string;
  note?: Note;
  trigger: ReactNode;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const createNoteMutation = useCreateNoteMutation(projectId);
  const updateNoteMutation = useUpdateNoteMutation(projectId);
  const isPending = createNoteMutation.isPending || updateNoteMutation.isPending;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setTitle(note?.title ?? "");
      setBody(note?.body ?? "");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !body.trim()) {
      return;
    }

    const onError = (error: unknown) =>
      toast.error(error instanceof Error ? error.message : t("projectDetail.notes.fallbackError"));
    const onSuccess = () => setOpen(false);
    const input = { title: title.trim(), body: body.trim() };

    if (note) {
      updateNoteMutation.mutate({ noteId: note.id, input }, { onError, onSuccess });
    } else {
      createNoteMutation.mutate(input, { onError, onSuccess });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>
              {note ? t("projectDetail.notes.editTitle") : t("projectDetail.notes.addTitle")}
            </DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="note-title">{t("projectDetail.notes.noteTitle")}</FieldLabel>
            <Input
              id="note-title"
              value={title}
              required
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="note-body">{t("projectDetail.notes.body")}</FieldLabel>
            <Textarea
              id="note-body"
              rows={8}
              value={body}
              required
              onChange={(event) => setBody(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("projectDetail.notes.saving") : t("projectDetail.notes.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
