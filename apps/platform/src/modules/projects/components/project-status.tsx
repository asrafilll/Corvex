import { useTranslation } from "@repo/i18n";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import type { ProjectStatus } from "../services";

export const projectStatusMeta: Record<
  ProjectStatus,
  { dot: string; text: string; pill: string; menu: string }
> = {
  Lead: {
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
    pill: "border-border bg-muted text-muted-foreground",
    menu: "focus:bg-muted data-[state=checked]:bg-muted data-[state=checked]:text-foreground",
  },
  Active: {
    dot: "bg-highlight",
    text: "text-highlight",
    pill: "border-foreground bg-highlight text-highlight-foreground",
    menu: "focus:bg-highlight focus:text-highlight-foreground data-[state=checked]:bg-highlight data-[state=checked]:text-highlight-foreground",
  },
  OnHold: {
    dot: "bg-foreground/55",
    text: "text-foreground",
    pill: "border-foreground bg-primary text-primary-foreground",
    menu: "focus:bg-foreground/15 data-[state=checked]:bg-foreground/15 data-[state=checked]:text-foreground",
  },
  Completed: {
    dot: "bg-foreground",
    text: "text-foreground",
    pill: "border-foreground bg-card text-foreground",
    menu: "focus:bg-primary focus:text-primary-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
  },
  Cancelled: {
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground line-through",
    pill: "border-border bg-muted text-muted-foreground",
    menu: "focus:bg-muted focus:text-muted-foreground data-[state=checked]:bg-muted data-[state=checked]:text-muted-foreground",
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation();
  const meta = projectStatusMeta[status];

  return (
    <Badge variant="outline" className={cn("gap-1.5 text-sm font-bold", meta.text)}>
      <span className={cn("size-2 rounded-sm border border-border", meta.dot)} />
      {t(`projects.status.${status}`)}
    </Badge>
  );
}
