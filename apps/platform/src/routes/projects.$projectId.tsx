import { useTranslation } from "@repo/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { formatDate, formatMoney } from "../lib/format";
import { PlatformAppShell } from "../modules/app-shell/app-shell";
import { meQueryOptions } from "../modules/auth/hooks/use-auth";
import { UnauthorizedError } from "../modules/auth/services";
import { McpTokensRail } from "../modules/mcp-tokens/components/mcp-tokens-rail";
import { MilestonesRail } from "../modules/milestones/components/milestones-rail";
import { PaymentsRail } from "../modules/payments/components/payments-rail";
import { NotesSection } from "../modules/project-notes/components/notes-section";
import { projectStatusMeta } from "../modules/projects/components/project-status";
import {
  projectQueryOptions,
  useUpdateProjectMutation,
} from "../modules/projects/hooks/use-projects";
import { type ProjectStatus, projectStatusValues } from "../modules/projects/services";
import { SecretsRail } from "../modules/secrets/components/secrets-rail";
import { TasksSection } from "../modules/tasks/components/tasks-section";

export const Route = createFileRoute("/projects/$projectId")({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(meQueryOptions);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw redirect({ to: "/login" });
      }

      throw error;
    }
  },
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const project = useQuery(projectQueryOptions(projectId));
  const updateProjectMutation = useUpdateProjectMutation(projectId);
  const data = project.data;

  return (
    <PlatformAppShell fullWidth>
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-5">
        <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">
          {t("projects.title")}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        {data ? (
          <>
            <span className="text-sm font-medium">{data.name}</span>
            <Select
              value={data.status}
              onValueChange={(value) =>
                updateProjectMutation.mutate(
                  { status: value as ProjectStatus },
                  {
                    onError: (error) =>
                      toast.error(
                        error instanceof Error ? error.message : t("projectDetail.statusError"),
                      ),
                  },
                )
              }
            >
              <SelectTrigger
                size="sm"
                className={cn("gap-1.5 border px-2 text-xs", projectStatusMeta[data.status].pill)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectStatusValues.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`projects.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDate(data.deadline)}
            </span>
          </>
        ) : (
          <Skeleton className="h-4 w-40" />
        )}
      </div>

      {data ? (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4">
            <TasksSection projectId={projectId} tasks={data.tasks} />
            <NotesSection projectId={projectId} notes={data.notes} />
          </div>
          <aside className="flex w-64 shrink-0 flex-col gap-5 border-l px-4 py-4 text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("projectDetail.customer")}
              </span>
              {data.customer ? (
                <Link
                  to="/customers/$customerId"
                  params={{ customerId: data.customer.id }}
                  className="font-medium hover:underline"
                >
                  {data.customer.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">{t("projectDetail.noCustomer")}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("projectDetail.budget")}
              </span>
              <dl className="flex flex-col gap-0.5">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("projectDetail.budgetTotal")}</dt>
                  <dd className="tabular-nums">{formatMoney(data.budgetAmount, data.currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("projectDetail.paid")}</dt>
                  <dd className="tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatMoney(data.paidTotal, data.currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("projectDetail.outstanding")}</dt>
                  <dd className="tabular-nums text-amber-600 dark:text-amber-400">
                    {formatMoney(data.outstanding, data.currency)}
                  </dd>
                </div>
              </dl>
            </div>

            <PaymentsRail projectId={projectId} payments={data.payments} currency={data.currency} />
            <MilestonesRail projectId={projectId} milestones={data.milestones} />
            <SecretsRail projectId={projectId} secrets={data.secrets} />
            <McpTokensRail projectId={projectId} mcpTokens={data.mcpTokens} />
          </aside>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4 py-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}
    </PlatformAppShell>
  );
}
