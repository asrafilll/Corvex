import { useTranslation } from "@repo/i18n";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { Field, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/sonner";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { customersQueryOptions } from "../../customers/hooks/use-customers";
import { useCreateProjectMutation } from "../hooks/use-projects";
import { type ProjectStatus, projectStatusValues } from "../services";

const noCustomerValue = "none";

export function CreateProjectDialog() {
  const { t } = useTranslation();
  const customers = useQuery(customersQueryOptions);
  const createProjectMutation = useCreateProjectMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState(noCustomerValue);
  const [status, setStatus] = useState<ProjectStatus>("Lead");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("USD");

  function resetForm() {
    setName("");
    setCustomerId(noCustomerValue);
    setStatus("Lead");
    setDeadline("");
    setBudget("");
    setCurrency("USD");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    createProjectMutation.mutate(
      {
        name: name.trim(),
        status,
        customerId: customerId === noCustomerValue ? null : customerId,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        budgetAmount: budget.trim() || null,
        currency: currency.trim() || undefined,
      },
      {
        onError: (error) => {
          const message = error instanceof Error ? error.message : t("projects.form.fallbackError");
          toast.error(message);
        },
        onSuccess: () => {
          toast.success(t("projects.form.created"));
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <PlusIcon className="size-4" />
          {t("projects.new")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("projects.form.title")}</DialogTitle>
            <DialogDescription>{t("projects.form.description")}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="project-name">{t("projects.form.name")}</FieldLabel>
            <Input
              id="project-name"
              value={name}
              required
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-customer">{t("projects.form.customer")}</FieldLabel>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger id="project-customer" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noCustomerValue}>{t("projects.form.customerNone")}</SelectItem>
                {(customers.data ?? []).map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="project-status">{t("projects.form.status")}</FieldLabel>
            <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
              <SelectTrigger id="project-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectStatusValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`projects.status.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="project-deadline">{t("projects.form.deadline")}</FieldLabel>
            <Input
              id="project-deadline"
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </Field>
          <div className="grid grid-cols-[1fr_6rem] gap-3">
            <Field>
              <FieldLabel htmlFor="project-budget">{t("projects.form.budget")}</FieldLabel>
              <Input
                id="project-budget"
                inputMode="decimal"
                placeholder="0.00"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="project-currency">{t("projects.form.currency")}</FieldLabel>
              <Input
                id="project-currency"
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending
                ? t("projects.form.pending")
                : t("projects.form.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
