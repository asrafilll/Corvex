import { useTranslation } from "@repo/i18n";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { PlatformAppShell } from "../modules/app-shell/app-shell";
import { meQueryOptions } from "../modules/auth/hooks/use-auth";
import { UnauthorizedError } from "../modules/auth/services";
import { ProjectStatusBadge } from "../modules/projects/components/project-status";
import { projectQueryOptions } from "../modules/projects/hooks/use-projects";
import { formatDate } from "../lib/format";

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

  return (
    <PlatformAppShell fullWidth>
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-5">
        <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">
          {t("projects.title")}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        {project.data ? (
          <>
            <span className="text-sm font-medium">{project.data.name}</span>
            <ProjectStatusBadge status={project.data.status} />
            <span className="ml-auto text-xs text-muted-foreground">
              {formatDate(project.data.deadline)}
            </span>
          </>
        ) : (
          <Skeleton className="h-4 w-40" />
        )}
      </div>
      <div className="px-4 py-4 text-sm text-muted-foreground">
        {project.data?.description ?? null}
      </div>
    </PlatformAppShell>
  );
}
