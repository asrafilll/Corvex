import { useTranslation } from "@repo/i18n";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import type { ProjectStatus } from "../services";

export const projectStatusMeta: Record<ProjectStatus, { dot: string; text: string }> = {
  Lead: { dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
  Active: { dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400" },
  OnHold: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  Completed: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  Cancelled: { dot: "bg-muted-foreground/40", text: "text-muted-foreground line-through" },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation();
  const meta = projectStatusMeta[status];

  return (
    <Badge variant="outline" className={cn("gap-1.5 font-normal", meta.text)}>
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {t(`projects.status.${status}`)}
    </Badge>
  );
}
