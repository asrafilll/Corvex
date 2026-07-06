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
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("projectDetail.milestones.title")}{" "}
        <span className="font-normal">{milestones.length}</span>
      </h3>
      {milestones.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {milestones.map((milestone) => (
            <li key={milestone.id} className="flex items-center gap-2">
              <Checkbox
                id={`milestone-${milestone.id}`}
                checked={milestone.done}
                className="size-3.5"
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
                  "min-w-0 flex-1 truncate",
                  milestone.done && "text-muted-foreground line-through",
                )}
              >
                {milestone.name}
              </label>
              <span className="text-muted-foreground">{formatDate(milestone.date)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <form onSubmit={handleAdd} className="flex items-center gap-1">
        <Input
          value={name}
          placeholder={t("projectDetail.milestones.name")}
          className="h-7 text-xs"
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          value={date}
          type="date"
          className="h-7 w-28 text-xs"
          onChange={(event) => setDate(event.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          disabled={createMilestoneMutation.isPending}
        >
          {t("projectDetail.milestones.add")}
        </Button>
      </form>
    </div>
  );
}
