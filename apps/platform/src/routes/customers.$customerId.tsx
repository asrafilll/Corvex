import { useTranslation } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";
import { PlatformAppShell } from "../modules/app-shell/app-shell";
import { meQueryOptions } from "../modules/auth/hooks/use-auth";
import { UnauthorizedError } from "../modules/auth/services";
import { EditCustomerDialog } from "../modules/customers/components/customer-form-dialog";
import { customerQueryOptions } from "../modules/customers/hooks/use-customers";
import { projectStatusMeta } from "../modules/projects/components/project-status";
import { formatDate, formatMoney } from "../lib/format";

export const Route = createFileRoute("/customers/$customerId")({
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
  component: CustomerDetailPage,
});

function CustomerDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { customerId } = Route.useParams();
  const customer = useQuery(customerQueryOptions(customerId));

  return (
    <PlatformAppShell fullWidth>
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-5">
        <Link to="/customers" className="text-sm text-muted-foreground hover:text-foreground">
          {t("customers.title")}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        {customer.data ? (
          <>
            <span className="text-sm font-medium">{customer.data.name}</span>
            <span className="ml-auto">
              <EditCustomerDialog
                customer={customer.data}
                trigger={
                  <Button size="sm" variant="ghost">
                    <PencilIcon className="size-4" />
                    {t("customers.edit")}
                  </Button>
                }
              />
            </span>
          </>
        ) : (
          <Skeleton className="h-4 w-40" />
        )}
      </div>

      {customer.data ? (
        <div className="flex flex-col gap-6 px-4 py-4">
          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("customers.detail.contact")}
            </h2>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <MetadataPair label={t("customers.detail.email")} value={customer.data.email} />
              <MetadataPair label={t("customers.detail.phone")} value={customer.data.phone} />
              <MetadataPair label={t("customers.detail.company")} value={customer.data.company} />
            </dl>
            {customer.data.notes ? (
              <div className="mt-1 grid gap-1 text-sm">
                <span className="text-xs text-muted-foreground">{t("customers.detail.notes")}</span>
                <p className="whitespace-pre-wrap">{customer.data.notes}</p>
              </div>
            ) : null}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("customers.detail.projects")}{" "}
              <span className="font-normal">{customer.data.projectCount}</span>
            </h2>
            {customer.data.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("customers.detail.noProjects")}</p>
            ) : (
              <div className="divide-y border-y">
                {customer.data.projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className="flex h-9 w-full cursor-pointer items-center gap-2.5 text-left text-sm hover:bg-muted/50"
                    onClick={() =>
                      navigate({ to: "/projects/$projectId", params: { projectId: project.id } })
                    }
                  >
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${projectStatusMeta[project.status].dot}`}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{project.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(project.deadline)}
                    </span>
                    <span className="w-28 text-right text-xs tabular-nums text-muted-foreground">
                      {formatMoney(project.budgetAmount, project.currency)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="flex flex-col gap-2 px-4 py-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      )}
    </PlatformAppShell>
  );
}

function MetadataPair({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </div>
  );
}
