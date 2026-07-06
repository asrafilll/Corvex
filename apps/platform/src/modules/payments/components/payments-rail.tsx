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
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("projectDetail.payments.title")} <span className="font-normal">{payments.length}</span>
      </h3>
      {payments.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {payments.map((payment) => (
            <li key={payment.id} className="group flex items-center gap-2">
              <span className="text-muted-foreground">{formatDate(payment.date)}</span>
              <span className="ml-auto tabular-nums">{formatMoney(payment.amount, currency)}</span>
              <button
                type="button"
                aria-label={t("projectDetail.payments.delete")}
                className="text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                onClick={() => deletePaymentMutation.mutate(payment.id, { onError: showError })}
              >
                <Trash2Icon className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <form onSubmit={handleAdd} className="flex items-center gap-1">
        <Input
          value={amount}
          inputMode="decimal"
          placeholder={t("projectDetail.payments.amount")}
          className="h-7 text-xs"
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          value={date}
          type="date"
          className="h-7 w-28 text-xs"
          onChange={(event) => setDate(event.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs"
          disabled={createPaymentMutation.isPending}
        >
          {t("projectDetail.payments.add")}
        </Button>
      </form>
    </div>
  );
}
