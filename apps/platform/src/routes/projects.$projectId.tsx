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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { cn } from "@repo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import {
  ActivityIcon,
  ClipboardListIcon,
  CreditCardIcon,
  FlagIcon,
  KeyRoundIcon,
  LayoutPanelTopIcon,
  PlugIcon,
} from "lucide-react";
import { formatDate, formatMoney } from "../lib/format";
import { ActivityTimeline } from "../modules/activities/components/activity-timeline";
import { PlatformAppShell } from "../modules/app-shell/app-shell";
import { appSessionQueryOptions } from "../modules/auth/hooks/use-auth";
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
import {
  type ProjectDetail,
  type ProjectStatus,
  projectStatusValues,
} from "../modules/projects/services";
import { SecretsRail } from "../modules/secrets/components/secrets-rail";
import { TasksSection } from "../modules/tasks/components/tasks-section";

const projectTabValues = [
  "overview",
  "tasks",
  "payments",
  "milestones",
  "secrets",
  "tokens",
  "activity",
] as const;

type ProjectTab = (typeof projectTabValues)[number];

type ProjectDetailSearch = {
  tab?: ProjectTab;
  task?: string;
};

export const Route = createFileRoute("/projects/$projectId")({
  validateSearch: (search: Record<string, unknown>): ProjectDetailSearch => ({
    tab:
      typeof search.tab === "string" && projectTabValues.includes(search.tab as ProjectTab)
        ? (search.tab as ProjectTab)
        : undefined,
    task: typeof search.task === "string" && search.task.trim() ? search.task : undefined,
  }),
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(appSessionQueryOptions);
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
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/projects/$projectId" });
  const project = useQuery(projectQueryOptions(projectId));
  const updateProjectMutation = useUpdateProjectMutation(projectId);
  const data = project.data;

  return (
    <PlatformAppShell fullWidth>
      <div className="flex min-h-20 shrink-0 items-center gap-2.5 bg-card px-6 py-4">
        <Link
          to="/projects"
          className="text-base font-bold text-muted-foreground hover:text-foreground"
        >
          {t("projects.title")}
        </Link>
        <span className="text-base font-bold text-muted-foreground">/</span>
        {data ? (
          <>
            <span className="text-xl font-bold tracking-tight">{data.name}</span>
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
                className={cn(
                  "h-9 gap-1.5 border px-3 text-sm font-semibold shadow-none",
                  projectStatusMeta[data.status].pill,
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-foreground">
                {projectStatusValues.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className={cn(
                      "min-h-12 rounded-lg py-3 pr-10 pl-3 text-base font-semibold",
                      projectStatusMeta[status].menu,
                    )}
                  >
                    <span
                      className={cn(
                        "size-2.5 shrink-0 rounded-sm border border-current",
                        projectStatusMeta[status].dot,
                      )}
                    />
                    <span
                      className={cn(status === "Cancelled" && "text-muted-foreground line-through")}
                    >
                      {t(`projects.status.${status}`)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-sm font-medium text-muted-foreground">
              {formatDate(data.deadline)}
            </span>
          </>
        ) : (
          <Skeleton className="h-4 w-40" />
        )}
      </div>

      {data ? (
        <Tabs
          value={search.tab ?? "overview"}
          onValueChange={(value) =>
            void navigate({
              search: { tab: value as ProjectTab, task: undefined },
              replace: true,
            })
          }
          className="min-h-0 flex-1 gap-0"
        >
          <div className="shrink-0 bg-background px-6 py-4">
            <div className="overflow-x-auto pb-1">
              <TabsList className="h-16 min-w-max border-0 p-2">
                <TabsTrigger
                  value="overview"
                  className="group min-w-32 px-4 py-3 text-base font-semibold"
                >
                  <LayoutPanelTopIcon />
                  {t("projectDetail.tabs.overview")}
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="group min-w-28 px-4 py-3 text-base font-semibold"
                >
                  <ClipboardListIcon />
                  {t("projectDetail.tabs.tasks")}
                  <TabCount value={data.tasks.length} />
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="group min-w-36 px-4 py-3 text-base font-semibold"
                >
                  <CreditCardIcon />
                  {t("projectDetail.tabs.payments")}
                  <TabCount value={data.payments.length} />
                </TabsTrigger>
                <TabsTrigger
                  value="milestones"
                  className="group min-w-40 px-4 py-3 text-base font-semibold"
                >
                  <FlagIcon />
                  {t("projectDetail.tabs.milestones")}
                  <TabCount value={data.milestones.length} />
                </TabsTrigger>
                <TabsTrigger
                  value="secrets"
                  className="group min-w-32 px-4 py-3 text-base font-semibold"
                >
                  <KeyRoundIcon />
                  {t("projectDetail.tabs.secrets")}
                  <TabCount value={data.secrets.length} />
                </TabsTrigger>
                <TabsTrigger
                  value="tokens"
                  className="group min-w-40 px-4 py-3 text-base font-semibold"
                >
                  <PlugIcon />
                  {t("projectDetail.tabs.tokens")}
                  <TabCount value={data.mcpTokens.length} />
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="group min-w-32 px-4 py-3 text-base font-semibold"
                >
                  <ActivityIcon />
                  {t("projectDetail.tabs.activity")}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <TabsContent value="overview" className="mt-0 min-h-0 flex-1 px-6 py-6">
            <ProjectOverview projectId={projectId} project={data} />
          </TabsContent>
          <TabsContent value="tasks" className="mt-0 min-h-0 flex-1 px-6 py-6">
            <TasksSection
              projectId={projectId}
              tasks={data.tasks}
              selectedTaskId={search.task}
              onSelectedTaskIdChange={(task) =>
                void navigate({
                  search: { tab: "tasks", task },
                  replace: true,
                })
              }
            />
          </TabsContent>
          <TabsContent value="payments" className="mt-0 min-h-0 flex-1 px-6 py-6">
            <PaymentsRail projectId={projectId} payments={data.payments} currency={data.currency} />
          </TabsContent>
          <TabsContent value="milestones" className="mt-0 min-h-0 flex-1 px-6 py-6">
            <MilestonesRail projectId={projectId} milestones={data.milestones} />
          </TabsContent>
          <TabsContent value="secrets" className="mt-0 min-h-0 flex-1 px-6 py-6">
            <SecretsRail projectId={projectId} secrets={data.secrets} />
          </TabsContent>
          <TabsContent value="tokens" className="mt-0 min-h-0 flex-1 px-6 py-6">
            <McpTokensRail projectId={projectId} mcpTokens={data.mcpTokens} />
          </TabsContent>
          <TabsContent value="activity" className="mt-0 min-h-0 flex-1 px-6 py-6">
            <ActivityTimeline projectId={projectId} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col gap-3 px-6 py-6">
          <Skeleton className="h-11 w-80" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}
    </PlatformAppShell>
  );
}

function TabCount({ value }: { value: number }) {
  return (
    <span className="rounded-sm bg-foreground/10 px-1.5 py-0.5 text-xs leading-none text-foreground group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
      {value}
    </span>
  );
}

function ProjectOverview({
  projectId,
  project,
}: {
  projectId: string;
  project: NonNullable<ProjectDetail>;
}) {
  const { t } = useTranslation();

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-muted/60 p-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {t("projectDetail.customer")}
            </span>
            {project.customer ? (
              <Link
                to="/customers/$customerId"
                params={{ customerId: project.customer.id }}
                className="text-base font-bold hover:underline"
              >
                {project.customer.name}
              </Link>
            ) : (
              <span className="text-muted-foreground">{t("projectDetail.noCustomer")}</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-foreground bg-primary p-5 text-primary-foreground shadow-sm">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground/65">
              {t("projectDetail.budget")}
            </span>
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="flex justify-between gap-3">
                <dt className="text-primary-foreground/65">{t("projectDetail.budgetTotal")}</dt>
                <dd className="font-semibold tabular-nums">
                  {formatMoney(project.budgetAmount, project.currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-primary-foreground/65">{t("projectDetail.paid")}</dt>
                <dd className="font-semibold tabular-nums">
                  {formatMoney(project.paidTotal, project.currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-primary-foreground/65">{t("projectDetail.outstanding")}</dt>
                <dd className="font-semibold tabular-nums">
                  {formatMoney(project.outstanding, project.currency)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      <NotesSection projectId={projectId} notes={project.notes} />
    </main>
  );
}
