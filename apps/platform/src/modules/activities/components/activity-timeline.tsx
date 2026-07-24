import { useTranslation } from "@repo/i18n";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { BotIcon, HistoryIcon, MonitorIcon } from "lucide-react";
import { formatDateTime } from "../../../lib/format";
import { activitiesQueryOptions } from "../hooks/use-activities";
import type { ProjectActivity } from "../services";

export function ActivityTimeline({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const activities = useQuery(activitiesQueryOptions(projectId));

  if (activities.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (activities.isError) {
    return <p className="text-base text-destructive">{t("projectDetail.activity.loadError")}</p>;
  }

  if (activities.data.length === 0) {
    return (
      <Empty className="border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HistoryIcon />
          </EmptyMedia>
          <EmptyTitle>{t("projectDetail.activity.emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("projectDetail.activity.emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.1em]">
          {t("projectDetail.activity.title")}
        </h2>
        <span className="rounded-sm border border-border bg-card px-2 py-0.5 text-xs font-bold tabular-nums">
          {activities.data.length}
        </span>
      </div>
      <div className="divide-y divide-border">
        {activities.data.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </div>
    </section>
  );
}

function ActivityRow({ activity }: { activity: ProjectActivity }) {
  const { t } = useTranslation();
  const isMcp = activity.actorType === "Mcp";
  const actor = isMcp
    ? t("projectDetail.activity.actorMcp", { name: activity.actorLabel ?? "MCP" })
    : t("projectDetail.activity.actorApp");

  return (
    <div className="flex min-h-16 items-start gap-3 px-4 py-3.5">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        {isMcp ? <BotIcon className="size-4" /> : <MonitorIcon className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base leading-6">
          <span className="font-bold">{actor}</span>{" "}
          {t(`projectDetail.activity.actions.${activity.action}`)}{" "}
          {t(`projectDetail.activity.entities.${activity.entityType}`).toLowerCase()}{" "}
          <span className="font-semibold">“{activity.entityLabel}”</span>
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{formatDateTime(activity.createdAt)}</p>
      </div>
    </div>
  );
}
