import { useTranslation } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@repo/ui/components/empty";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { PlatformAppShell } from "../modules/app-shell/app-shell";
import { meQueryOptions } from "../modules/auth/hooks/use-auth";
import { UnauthorizedError } from "../modules/auth/services";
import { CreateCustomerDialog } from "../modules/customers/components/customer-form-dialog";
import { customersQueryOptions } from "../modules/customers/hooks/use-customers";

export const Route = createFileRoute("/customers/")({
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
  component: CustomersPage,
});

function CustomersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const customers = useQuery(customersQueryOptions);

  return (
    <PlatformAppShell fullWidth>
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">{t("customers.title")}</h1>
        <CreateCustomerDialog
          trigger={
            <Button size="sm">
              <PlusIcon className="size-4" />
              {t("customers.new")}
            </Button>
          }
        />
      </div>
      <div className="flex flex-col gap-4 px-4 py-4">
        {customers.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : customers.isError ? (
          <p className="text-sm text-destructive">{t("customers.loadError")}</p>
        ) : customers.data.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>{t("customers.title")}</EmptyTitle>
              <EmptyDescription>{t("customers.empty")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4 font-semibold">{t("customers.columns.name")}</th>
                  <th className="py-2 pr-4 font-semibold">{t("customers.columns.company")}</th>
                  <th className="py-2 pr-4 font-semibold">{t("customers.columns.email")}</th>
                  <th className="py-2 pr-4 font-semibold">{t("customers.columns.phone")}</th>
                  <th className="py-2 text-right font-semibold">
                    {t("customers.columns.projects")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customers.data.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      navigate({
                        to: "/customers/$customerId",
                        params: { customerId: customer.id },
                      })
                    }
                  >
                    <td className="py-2 pr-4 font-medium">{customer.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{customer.company ?? "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{customer.email ?? "—"}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{customer.phone ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {customer.projectCount}
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
