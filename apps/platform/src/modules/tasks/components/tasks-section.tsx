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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
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
import { cn } from "@repo/ui/lib/utils";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { formatDate } from "../../../lib/format";
import type { ProjectDetail } from "../../projects/services";
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useReorderTasksMutation,
  useUpdateTaskMutation,
} from "../hooks/use-tasks";
import {
  type TaskPriority,
  type TaskStatus,
  taskPriorityValues,
  taskStatusValues,
} from "../services";

type Task = NonNullable<ProjectDetail>["tasks"][number];

const groupOrder = [
  "InProgress",
  "Todo",
  "Done",
  "Cancelled",
] as const satisfies readonly TaskStatus[];

const priorityDotClasses: Record<TaskPriority, string> = {
  Urgent: "bg-primary",
  High: "bg-highlight",
  Medium: "bg-foreground/55",
  Low: "bg-foreground/25",
  None: "bg-muted-foreground/40",
};

const statusDotClasses: Record<TaskStatus, string> = {
  Todo: "border-muted-foreground/60",
  InProgress: "border-highlight bg-highlight/30",
  Done: "border-foreground bg-foreground",
  Cancelled: "border-muted-foreground/40 bg-muted-foreground/40",
};

export function TasksSection({
  projectId,
  tasks,
  selectedTaskId: controlledSelectedTaskId,
  onSelectedTaskIdChange,
}: {
  projectId: string;
  tasks: Task[];
  selectedTaskId?: string;
  onSelectedTaskIdChange?: (taskId: string | undefined) => void;
}) {
  const { t } = useTranslation();
  const updateTaskMutation = useUpdateTaskMutation(projectId);
  const reorderTasksMutation = useReorderTasksMutation(projectId);
  const [localSelectedTaskId, setLocalSelectedTaskId] = useState<string>();
  const isControlled = onSelectedTaskIdChange !== undefined;
  const selectedTaskId = isControlled ? controlledSelectedTaskId : localSelectedTaskId;
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  const groups = groupOrder
    .map((status) => ({ status, tasks: tasks.filter((task) => task.status === status) }))
    .filter((group) => group.tasks.length > 0 || group.status !== "Cancelled");

  function selectTask(taskId: string | undefined) {
    if (isControlled) {
      onSelectedTaskIdChange(taskId);
    } else {
      setLocalSelectedTaskId(taskId);
    }
  }

  function showError(error: unknown) {
    toast.error(error instanceof Error ? error.message : t("projectDetail.tasks.fallbackError"));
  }

  function moveTask(task: Task, direction: -1 | 1) {
    const flat = groups.flatMap((group) => group.tasks);
    const groupTasks = groups.find((group) => group.status === task.status)?.tasks ?? [];
    const indexInGroup = groupTasks.findIndex((candidate) => candidate.id === task.id);
    const swapWith = groupTasks[indexInGroup + direction];

    if (!swapWith) {
      return;
    }

    const ids = flat.map((candidate) => candidate.id);
    const a = ids.indexOf(task.id);
    const b = ids.indexOf(swapWith.id);
    [ids[a], ids[b]] = [ids[b] as string, ids[a] as string];

    reorderTasksMutation.mutate(ids, { onError: showError });
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex justify-end">
        <CreateTaskDialog projectId={projectId} />
      </div>
      {groups.map((group) => (
        <div key={group.status} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.1em]">
              {t(`projectDetail.tasks.groups.${group.status}`)}
            </h2>
            <span className="rounded-sm border border-border bg-card px-2 py-0.5 text-xs font-bold tabular-nums">
              {group.tasks.length}
            </span>
          </div>
          {group.tasks.length === 0 ? (
            <p className="px-4 py-5 text-base text-muted-foreground">
              {t("projectDetail.tasks.empty")}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {group.tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="group flex min-h-14 items-center gap-3 px-3 py-2 transition-colors hover:bg-accent focus-within:bg-accent"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("projectDetail.tasks.changeStatus")}
                        className={cn(
                          "size-4 shrink-0 cursor-pointer rounded-full border",
                          statusDotClasses[task.status],
                        )}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {taskStatusValues.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onSelect={() =>
                            updateTaskMutation.mutate(
                              { taskId: task.id, input: { status } },
                              { onError: showError },
                            )
                          }
                        >
                          <span
                            className={cn("size-3 rounded-full border", statusDotClasses[status])}
                          />
                          {t(`projectDetail.tasks.groups.${status}`)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-sm border border-border",
                      priorityDotClasses[task.priority],
                    )}
                    role="img"
                    aria-label={t(`projectDetail.tasks.priorities.${task.priority}`)}
                  />
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => selectTask(task.id)}
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-base font-medium",
                          (task.status === "Done" || task.status === "Cancelled") &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {task.title}
                      </span>
                      {task.description ? (
                        <span className="mt-0.5 line-clamp-2 block text-sm leading-5 text-muted-foreground">
                          {task.description}
                        </span>
                      ) : null}
                    </span>
                    {task.dueDate ? (
                      <span className="shrink-0 text-sm font-medium text-muted-foreground">
                        {formatDate(task.dueDate)}
                      </span>
                    ) : null}
                  </button>
                  <span className="flex items-center opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      disabled={index === 0}
                      aria-label={t("projectDetail.tasks.moveUp")}
                      onClick={() => moveTask(task, -1)}
                    >
                      <ChevronUpIcon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      disabled={index === group.tasks.length - 1}
                      aria-label={t("projectDetail.tasks.moveDown")}
                      onClick={() => moveTask(task, 1)}
                    >
                      <ChevronDownIcon className="size-4" />
                    </Button>
                    <DeleteTaskButton
                      projectId={projectId}
                      task={task}
                      onDeleted={() => selectedTaskId === task.id && selectTask(undefined)}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {selectedTask ? (
        <EditTaskDialog
          key={selectedTask.id}
          projectId={projectId}
          task={selectedTask}
          open
          onOpenChange={(open) => !open && selectTask(undefined)}
        />
      ) : null}
    </section>
  );
}

function CreateTaskDialog({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Todo");
  const [priority, setPriority] = useState<TaskPriority>("None");
  const [dueDate, setDueDate] = useState("");
  const createTaskMutation = useCreateTaskMutation(projectId);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setTitle("");
      setDescription("");
      setStatus("Todo");
      setPriority("None");
      setDueDate("");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    createTaskMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        dueDate: serializeDueDate(dueDate),
      },
      {
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("projectDetail.tasks.fallbackError"),
          ),
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" className="h-11 px-4 text-base">
          <PlusIcon className="size-4" />
          {t("projectDetail.tasks.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{t("projectDetail.tasks.addTitle")}</DialogTitle>
            <DialogDescription>{t("projectDetail.tasks.addDescription")}</DialogDescription>
          </DialogHeader>
          <TaskFields
            idPrefix="create-task"
            title={title}
            description={description}
            status={status}
            priority={priority}
            dueDate={dueDate}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
            onDueDateChange={setDueDate}
          />
          <DialogFooter>
            <Button type="submit" disabled={createTaskMutation.isPending || !title.trim()}>
              {createTaskMutation.isPending
                ? t("projectDetail.tasks.creating")
                : t("projectDetail.tasks.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTaskDialog({
  projectId,
  task,
  open,
  onOpenChange,
}: {
  projectId: string;
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(taskDateValue(task.dueDate));
  const updateTaskMutation = useUpdateTaskMutation(projectId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      return;
    }

    updateTaskMutation.mutate(
      {
        taskId: task.id,
        input: {
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          dueDate: serializeDueDate(dueDate),
        },
      },
      {
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("projectDetail.tasks.fallbackError"),
          ),
        onSuccess: () => {
          toast.success(t("projectDetail.tasks.saved"));
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{t("projectDetail.tasks.editTitle")}</DialogTitle>
            <DialogDescription>{t("projectDetail.tasks.editDescription")}</DialogDescription>
          </DialogHeader>
          <TaskFields
            idPrefix={`edit-task-${task.id}`}
            title={title}
            description={description}
            status={status}
            priority={priority}
            dueDate={dueDate}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onStatusChange={setStatus}
            onPriorityChange={setPriority}
            onDueDateChange={setDueDate}
          />
          <DialogFooter>
            <Button type="submit" disabled={updateTaskMutation.isPending || !title.trim()}>
              {updateTaskMutation.isPending
                ? t("projectDetail.tasks.saving")
                : t("projectDetail.tasks.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaskFields({
  idPrefix,
  title,
  description,
  status,
  priority,
  dueDate,
  onTitleChange,
  onDescriptionChange,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
}: {
  idPrefix: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStatusChange: (value: TaskStatus) => void;
  onPriorityChange: (value: TaskPriority) => void;
  onDueDateChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-title`}>{t("projectDetail.tasks.title")}</FieldLabel>
        <Input
          id={`${idPrefix}-title`}
          value={title}
          autoFocus
          required
          className="h-11 text-base"
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-description`}>
          {t("projectDetail.tasks.description")}
        </FieldLabel>
        <Textarea
          id={`${idPrefix}-description`}
          value={description}
          rows={6}
          className="text-base"
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-status`}>{t("projectDetail.tasks.status")}</FieldLabel>
          <Select value={status} onValueChange={(value) => onStatusChange(value as TaskStatus)}>
            <SelectTrigger id={`${idPrefix}-status`} className="h-11 w-full text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskStatusValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`projectDetail.tasks.groups.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-priority`}>
            {t("projectDetail.tasks.priority")}
          </FieldLabel>
          <Select
            value={priority}
            onValueChange={(value) => onPriorityChange(value as TaskPriority)}
          >
            <SelectTrigger id={`${idPrefix}-priority`} className="h-11 w-full text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskPriorityValues.map((value) => (
                <SelectItem key={value} value={value}>
                  <span
                    className={cn(
                      "size-2.5 rounded-sm border border-border",
                      priorityDotClasses[value],
                    )}
                  />
                  {t(`projectDetail.tasks.priorities.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-due-date`}>{t("projectDetail.tasks.dueDate")}</FieldLabel>
        <Input
          id={`${idPrefix}-due-date`}
          type="date"
          value={dueDate}
          className="h-11 text-base"
          onChange={(event) => onDueDateChange(event.target.value)}
        />
      </Field>
    </>
  );
}

function DeleteTaskButton({
  projectId,
  task,
  onDeleted,
}: {
  projectId: string;
  task: Task;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const deleteTaskMutation = useDeleteTaskMutation(projectId);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 text-muted-foreground hover:text-destructive"
          aria-label={t("projectDetail.tasks.delete")}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("projectDetail.tasks.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("projectDetail.tasks.deleteBody", { name: task.title })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("projectDetail.tasks.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteTaskMutation.isPending}
            onClick={() =>
              deleteTaskMutation.mutate(task.id, {
                onError: (error) =>
                  toast.error(
                    error instanceof Error ? error.message : t("projectDetail.tasks.fallbackError"),
                  ),
                onSuccess: onDeleted,
              })
            }
          >
            {t("projectDetail.tasks.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function taskDateValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function serializeDueDate(value: string) {
  return value ? `${value}T00:00:00.000Z` : null;
}
