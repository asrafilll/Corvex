import { useTranslation } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import { ChevronDownIcon, ChevronUpIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { formatDate } from "../../../lib/format";
import type { ProjectDetail } from "../../projects/services";
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useReorderTasksMutation,
  useUpdateTaskMutation,
} from "../hooks/use-tasks";
import { type TaskPriority, type TaskStatus, taskStatusValues } from "../services";

type Task = NonNullable<ProjectDetail>["tasks"][number];

const groupOrder = [
  "InProgress",
  "Todo",
  "Done",
  "Cancelled",
] as const satisfies readonly TaskStatus[];

const priorityDotClasses: Record<TaskPriority, string> = {
  Urgent: "bg-red-500",
  High: "bg-orange-400",
  Medium: "bg-yellow-400",
  Low: "bg-sky-400",
  None: "bg-muted-foreground/40",
};

const statusDotClasses: Record<TaskStatus, string> = {
  Todo: "border-muted-foreground/60",
  InProgress: "border-violet-500 bg-violet-500/30",
  Done: "border-emerald-500 bg-emerald-500",
  Cancelled: "border-muted-foreground/40 bg-muted-foreground/40",
};

export function TasksSection({ projectId, tasks }: { projectId: string; tasks: Task[] }) {
  const { t } = useTranslation();
  const [newTitle, setNewTitle] = useState("");
  const createTaskMutation = useCreateTaskMutation(projectId);
  const updateTaskMutation = useUpdateTaskMutation(projectId);
  const deleteTaskMutation = useDeleteTaskMutation(projectId);
  const reorderTasksMutation = useReorderTasksMutation(projectId);

  const groups = groupOrder
    .map((status) => ({ status, tasks: tasks.filter((task) => task.status === status) }))
    .filter((group) => group.tasks.length > 0 || group.status !== "Cancelled");

  function showError(error: unknown) {
    toast.error(error instanceof Error ? error.message : t("projectDetail.tasks.fallbackError"));
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTitle.trim()) {
      return;
    }

    createTaskMutation.mutate(
      { title: newTitle.trim() },
      {
        onError: showError,
        onSuccess: () => setNewTitle(""),
      },
    );
  }

  function moveTask(task: Task, direction: -1 | 1) {
    // Display order is the source of truth for reorder: flatten the visible groups.
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
    <section className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.status} className="flex flex-col gap-1">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t(`projectDetail.tasks.groups.${group.status}`)}{" "}
            <span className="font-normal">{group.tasks.length}</span>
          </h2>
          {group.tasks.length === 0 ? (
            <p className="py-1 text-xs text-muted-foreground">{t("projectDetail.tasks.empty")}</p>
          ) : (
            <div className="divide-y border-y">
              {group.tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="group flex h-8 items-center gap-2.5 px-1 hover:bg-muted/50"
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("projectDetail.tasks.changeStatus")}
                        className={cn(
                          "size-3.5 shrink-0 cursor-pointer rounded-full border-2",
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
                            className={cn(
                              "size-2.5 rounded-full border-2",
                              statusDotClasses[status],
                            )}
                          />
                          {t(`projectDetail.tasks.groups.${status}`)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      priorityDotClasses[task.priority],
                    )}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      (task.status === "Done" || task.status === "Cancelled") &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {task.title}
                  </span>
                  {task.dueDate ? (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(task.dueDate)}
                    </span>
                  ) : null}
                  <span className="flex items-center opacity-0 group-hover:opacity-100">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-6"
                      disabled={index === 0}
                      aria-label={t("projectDetail.tasks.moveUp")}
                      onClick={() => moveTask(task, -1)}
                    >
                      <ChevronUpIcon className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-6"
                      disabled={index === group.tasks.length - 1}
                      aria-label={t("projectDetail.tasks.moveDown")}
                      onClick={() => moveTask(task, 1)}
                    >
                      <ChevronDownIcon className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      aria-label={t("projectDetail.tasks.delete")}
                      onClick={() => deleteTaskMutation.mutate(task.id, { onError: showError })}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <form onSubmit={handleAdd}>
        <Input
          value={newTitle}
          placeholder={t("projectDetail.tasks.addPlaceholder")}
          disabled={createTaskMutation.isPending}
          onChange={(event) => setNewTitle(event.target.value)}
        />
      </form>
    </section>
  );
}
