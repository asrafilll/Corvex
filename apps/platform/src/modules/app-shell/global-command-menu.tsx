import { useTranslation } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@repo/ui/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Field, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/sonner";
import { Textarea } from "@repo/ui/components/textarea";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ClipboardListIcon,
  FileTextIcon,
  FolderKanbanIcon,
  PlusIcon,
  SearchIcon,
  UsersRoundIcon,
} from "lucide-react";
import { type FormEvent, useDeferredValue, useEffect, useState } from "react";
import { projectsQueryOptions } from "../projects/hooks/use-projects";
import { workspaceSearchQueryOptions } from "../search/hooks/use-search";
import type { WorkspaceSearchResult } from "../search/services";
import { useCreateTaskMutation } from "../tasks/hooks/use-tasks";

export function GlobalCommandMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const search = useQuery(workspaceSearchQueryOptions(open ? deferredQuery : ""));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (!isTyping && !event.metaKey && !event.ctrlKey && !event.altKey && event.key === "c") {
        event.preventDefault();
        setQuickTaskOpen(true);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setQuery("");
    }
  }

  function openQuickTask() {
    setOpen(false);
    setQuery("");
    setQuickTaskOpen(true);
  }

  function openResult(result: WorkspaceSearchResult) {
    setOpen(false);
    setQuery("");

    if (result.kind === "Project") {
      void navigate({ to: "/projects/$projectId", params: { projectId: result.id } });
      return;
    }

    if (result.kind === "Customer") {
      void navigate({ to: "/customers/$customerId", params: { customerId: result.id } });
      return;
    }

    if (result.kind === "Task") {
      void navigate({
        to: "/projects/$projectId",
        params: { projectId: result.projectId },
        search: { tab: "tasks", task: result.id },
      });
      return;
    }

    void navigate({
      to: "/projects/$projectId",
      params: { projectId: result.projectId },
      search: { tab: "overview" },
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="h-10 w-full justify-start border border-white/15 bg-white/5 px-3 text-white/70 hover:bg-white/10 hover:text-white"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="size-4" />
        <span className="flex-1 text-left">{t("command.trigger")}</span>
        <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[11px] font-bold text-white">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={t("command.title")}
        description={t("command.description")}
        className="border-foreground shadow-md sm:max-w-2xl"
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={t("command.placeholder")}
          className="text-base"
        />
        <CommandList className="max-h-[28rem]">
          <CommandGroup heading={t("command.actions")}>
            <CommandItem value={t("command.newTask")} onSelect={openQuickTask}>
              <PlusIcon />
              {t("command.newTask")}
              <CommandShortcut>C</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          {deferredQuery ? (
            <CommandGroup heading={t("command.results")}>
              {search.data?.map((result) => (
                <CommandItem
                  key={`${result.kind}-${result.id}`}
                  value={`${result.kind} ${result.label} ${result.context ?? ""}`}
                  onSelect={() => openResult(result)}
                  className="min-h-14"
                >
                  <SearchResultIcon kind={result.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold">{result.label}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {t(`command.kinds.${result.kind}`)}
                      {result.context ? ` · ${result.context}` : ""}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {deferredQuery && !search.isPending && search.data?.length === 0 ? (
            <CommandEmpty>{t("command.empty")}</CommandEmpty>
          ) : null}
          {!deferredQuery ? <CommandEmpty>{t("command.hint")}</CommandEmpty> : null}
        </CommandList>
      </CommandDialog>

      <QuickTaskDialog open={quickTaskOpen} onOpenChange={setQuickTaskOpen} />
    </>
  );
}

function SearchResultIcon({ kind }: { kind: WorkspaceSearchResult["kind"] }) {
  const Icon =
    kind === "Project"
      ? FolderKanbanIcon
      : kind === "Customer"
        ? UsersRoundIcon
        : kind === "Task"
          ? ClipboardListIcon
          : FileTextIcon;

  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
      <Icon className="size-4" />
    </span>
  );
}

function QuickTaskDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const projects = useQuery(projectsQueryOptions());
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createTask = useCreateTaskMutation(projectId);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (nextOpen) {
      setProjectId("");
      setTitle("");
      setDescription("");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectId || !title.trim()) {
      return;
    }

    createTask.mutate(
      { title: title.trim(), description: description.trim() || null },
      {
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : t("command.taskError")),
        onSuccess: () => {
          toast.success(t("command.taskCreated"));
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{t("command.newTask")}</DialogTitle>
            <DialogDescription>{t("command.newTaskDescription")}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="quick-task-project">{t("command.project")}</FieldLabel>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="quick-task-project" className="h-11 w-full text-base">
                <SelectValue placeholder={t("command.selectProject")} />
              </SelectTrigger>
              <SelectContent>
                {(projects.data ?? []).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="quick-task-title">{t("projectDetail.tasks.title")}</FieldLabel>
            <Input
              id="quick-task-title"
              value={title}
              autoFocus
              required
              className="h-11 text-base"
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="quick-task-description">
              {t("projectDetail.tasks.description")}
            </FieldLabel>
            <Textarea
              id="quick-task-description"
              value={description}
              rows={4}
              className="text-base"
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={createTask.isPending || !projectId || !title.trim()}>
              {createTask.isPending
                ? t("projectDetail.tasks.creating")
                : t("projectDetail.tasks.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
