import { useTranslation } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import { type FormEvent, useState } from "react";
import { formatDate } from "../../../lib/format";
import type { ProjectDetail } from "../../projects/services";
import { useCreateMilestoneMutation, useUpdateMilestoneMutation } from "../hooks/use-milestones";

type Detail = NonNullable<ProjectDetail>;

export function MilestonesRail({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: Detail["milestones"];
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const createMilestoneMutation = useCreateMilestoneMutation(projectId);
  const updateMilestoneMutation = useUpdateMilestoneMutation(projectId);

  function showError(error: unknown) {
    toast.error(
      error instanceof Error ? error.message : t("projectDetail.milestones.fallbackError"),
    );
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !date) {
      return;
    }

    createMilestoneMutation.mutate(
      { name: name.trim(), date: new Date(date).toISOString() },
      {
        onError: showError,
        onSuccess: () => {
          setName("");
          setDate("");
        },
      },
    );
  }

  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">{t("projectDetail.milestones.title")}</h2>
        <span className="rounded-sm bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
          {milestones.length}
        </span>
      </div>
      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <Input
          value={name}
          placeholder={t("projectDetail.milestones.name")}
          className="h-11 text-base"
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          value={date}
          type="date"
          className="h-11 text-base"
          onChange={(event) => setDate(event.target.value)}
        />
        <Button
          type="submit"
          variant="secondary"
          className="h-11 px-5 text-base"
          disabled={createMilestoneMutation.isPending}
        >
          {t("projectDetail.milestones.add")}
        </Button>
      </form>
      {milestones.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-muted/50">
          {milestones.map((milestone) => (
            <li key={milestone.id} className="flex min-h-14 items-center gap-3 px-4 py-3">
              <Checkbox
                id={`milestone-${milestone.id}`}
                checked={milestone.done}
                className="size-5"
                onCheckedChange={(checked) =>
                  updateMilestoneMutation.mutate(
                    { milestoneId: milestone.id, input: { done: checked === true } },
                    { onError: showError },
                  )
                }
              />
              <label
                htmlFor={`milestone-${milestone.id}`}
                className={cn(
                  "min-w-0 flex-1 truncate text-base font-medium",
                  milestone.done && "text-muted-foreground line-through",
                )}
              >
                {milestone.name}
              </label>
              <span className="text-sm text-muted-foreground">{formatDate(milestone.date)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-muted/60 px-4 py-8 text-base text-muted-foreground">
          {t("projectDetail.milestones.empty")}
        </p>
      )}
    </section>
  );
}
