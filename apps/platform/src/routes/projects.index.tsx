import { useTranslation } from "@repo/i18n";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlatformAppShell } from "../modules/app-shell/app-shell";
import { meQueryOptions } from "../modules/auth/hooks/use-auth";
import { UnauthorizedError } from "../modules/auth/services";
import { CreateProjectDialog } from "../modules/projects/components/create-project-dialog";
import { projectStatusMeta } from "../modules/projects/components/project-status";
import { projectsQueryOptions } from "../modules/projects/hooks/use-projects";
import { type ProjectStatus, projectStatusValues } from "../modules/projects/services";
import { formatDate, formatMoney } from "../lib/format";

const allFilter = "all";

export const Route = createFileRoute("/projects/")({
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
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">{t("projects.title")}</h1>
        <CreateProjectDialog />
      </div>
      <div className="flex flex-col gap-4 px-4 py-4">
        <Tabs
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ProjectStatus | typeof allFilter)}
        >
          <TabsList>
            <TabsTrigger value={allFilter}>{t("projects.filters.all")}</TabsTrigger>
            {projectStatusValues.map((status) => (
              <TabsTrigger key={status} value={status}>
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
          <p className="text-sm text-destructive">{t("projects.loadError")}</p>
        ) : projects.data.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>{t("projects.title")}</EmptyTitle>
              <EmptyDescription>
                {statusFilter === allFilter ? t("projects.empty") : t("projects.emptyFiltered")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4 font-semibold">{t("projects.columns.name")}</th>
                  <th className="py-2 pr-4 font-semibold">{t("projects.columns.customer")}</th>
                  <th className="py-2 pr-4 font-semibold">{t("projects.columns.deadline")}</th>
                  <th className="py-2 text-right font-semibold">{t("projects.columns.budget")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.data.map((project) => (
                  <tr
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      navigate({ to: "/projects/$projectId", params: { projectId: project.id } })
                    }
                  >
                    <td className="py-2 pr-4">
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${projectStatusMeta[project.status].dot}`}
                        />
                        <span className="font-medium">{project.name}</span>
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {project.customer?.name ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {formatDate(project.deadline)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatMoney(project.budgetAmount, project.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PlatformAppShell>
  );
}
