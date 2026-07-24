import { useTranslation } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/sonner";
import { Trash2Icon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { formatDate, formatMoney } from "../../../lib/format";
import type { ProjectDetail } from "../../projects/services";
import { useCreatePaymentMutation, useDeletePaymentMutation } from "../hooks/use-payments";

type Detail = NonNullable<ProjectDetail>;

export function PaymentsRail({
  projectId,
  payments,
  currency,
}: {
  projectId: string;
  payments: Detail["payments"];
  currency: string;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const createPaymentMutation = useCreatePaymentMutation(projectId);
  const deletePaymentMutation = useDeletePaymentMutation(projectId);

  function showError(error: unknown) {
    toast.error(error instanceof Error ? error.message : t("projectDetail.payments.fallbackError"));
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!amount.trim()) {
      return;
    }

    createPaymentMutation.mutate(
      {
        amount: amount.trim(),
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      },
      {
        onError: showError,
        onSuccess: () => {
          setAmount("");
          setDate("");
        },
      },
    );
  }

  return (
    <section className="flex max-w-5xl flex-col gap-6">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">{t("projectDetail.payments.title")}</h2>
        <span className="rounded-sm bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
          {payments.length}
        </span>
      </div>
      <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <Input
          value={amount}
          inputMode="decimal"
          placeholder={t("projectDetail.payments.amount")}
          className="h-11 text-base"
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          value={date}
          type="date"
          className="h-11 text-base"
          onChange={(event) => setDate(event.target.value)}
        />
        <Button
          type="submit"
          variant="secondary"
          className="h-11 px-5 text-base"
          disabled={createPaymentMutation.isPending}
        >
          {t("projectDetail.payments.add")}
        </Button>
      </form>
      {payments.length > 0 ? (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-muted/50">
          {payments.map((payment) => (
            <li key={payment.id} className="group flex min-h-14 items-center gap-4 px-4 py-3">
              <span className="text-base text-muted-foreground">{formatDate(payment.date)}</span>
              <span className="ml-auto text-base font-semibold tabular-nums">
                {formatMoney(payment.amount, currency)}
              </span>
              <button
                type="button"
                aria-label={t("projectDetail.payments.delete")}
                className="p-2 text-muted-foreground opacity-0 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                onClick={() => deletePaymentMutation.mutate(payment.id, { onError: showError })}
              >
                <Trash2Icon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-muted/60 px-4 py-8 text-base text-muted-foreground">
          {t("projectDetail.payments.empty")}
        </p>
      )}
    </section>
  );
}
