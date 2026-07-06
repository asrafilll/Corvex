import { useTranslation } from "@repo/i18n";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import type { ProjectStatus } from "../services";

export const projectStatusMeta: Record<ProjectStatus, { dot: string; text: string; pill: string }> =
  {
    Lead: {
      dot: "bg-muted-foreground/40",
      text: "text-muted-foreground",
      pill: "border-border bg-muted text-muted-foreground",
    },
    Active: {
      dot: "bg-violet-500",
      text: "text-violet-600 dark:text-violet-400",
      pill: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    },
    OnHold: {
      dot: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      pill: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    Completed: {
      dot: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      pill: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    Cancelled: {
      dot: "bg-muted-foreground/40",
      text: "text-muted-foreground line-through",
      pill: "border-border bg-muted text-muted-foreground",
    },
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
