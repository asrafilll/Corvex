import { useTranslation } from "@repo/i18n";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlatformAppShell } from "../modules/app-shell/app-shell";
import { appSessionQueryOptions } from "../modules/auth/hooks/use-auth";
import { UnauthorizedError } from "../modules/auth/services";
import { CreateProjectDialog } from "../modules/projects/components/create-project-dialog";
import {
  ProjectStatusBadge,
  projectStatusMeta,
} from "../modules/projects/components/project-status";
import { projectsQueryOptions } from "../modules/projects/hooks/use-projects";
import { type ProjectStatus, projectStatusValues } from "../modules/projects/services";
import { formatDate, formatMoney } from "../lib/format";

const allFilter = "all";

export const Route = createFileRoute("/projects/")({
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
  component: ProjectsPage,
});

function ProjectsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | typeof allFilter>(allFilter);
  const projects = useQuery(
    projectsQueryOptions(statusFilter === allFilter ? undefined : statusFilter),
  );

  return (
    <PlatformAppShell fullWidth>
      <div className="flex min-h-20 shrink-0 items-center justify-between border-b bg-card px-6 py-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("projects.title")}</h1>
        <CreateProjectDialog />
      </div>
      <div className="flex flex-col gap-6 px-6 py-6">
        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ProjectStatus | typeof allFilter)}
        >
          <TabsList className="h-11">
            <TabsTrigger value={allFilter} className="min-w-16 px-4 text-base font-bold">
              {t("projects.filters.all")}
            </TabsTrigger>
            {projectStatusValues.map((status) => (
              <TabsTrigger key={status} value={status} className="px-4 text-base font-bold">
                {t(`projects.status.${status}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {projects.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : projects.isError ? (
          <p className="text-base font-medium text-destructive">{t("projects.loadError")}</p>
        ) : projects.data.length === 0 ? (
          <Empty className="rounded-xl border border-dashed border-foreground bg-card shadow-md">
            <EmptyHeader>
              <EmptyTitle>{t("projects.title")}</EmptyTitle>
              <EmptyDescription>
                {statusFilter === allFilter ? t("projects.empty") : t("projects.emptyFiltered")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-xl border border-foreground bg-card shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-base">
                <thead>
                  <tr className="border-b border-foreground bg-primary text-left text-xs font-semibold uppercase tracking-[0.1em] text-primary-foreground">
                    <th className="px-4 py-3 font-semibold">{t("projects.columns.name")}</th>
                    <th className="px-4 py-3 font-semibold">{t("projects.columns.status")}</th>
                    <th className="px-4 py-3 font-semibold">{t("projects.columns.customer")}</th>
                    <th className="px-4 py-3 font-semibold">{t("projects.columns.deadline")}</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      {t("projects.columns.budget")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.data.map((project) => (
                    <tr
                      key={project.id}
                      className="cursor-pointer transition-colors hover:bg-accent focus-within:bg-accent"
                      onClick={() =>
                        navigate({ to: "/projects/$projectId", params: { projectId: project.id } })
                      }
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: project.id }}
                          className="flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        >
                          <span
                            className={`size-3 shrink-0 rounded-sm border border-border ${projectStatusMeta[project.status].dot}`}
                          />
                          <span className="font-bold">{project.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <ProjectStatusBadge status={project.status} />
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {project.customer?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {formatDate(project.deadline)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums">
                        {formatMoney(project.budgetAmount, project.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PlatformAppShell>
  );
}
