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
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/sonner";
import { type FormEvent, type ReactNode, useState } from "react";
import { useCreateCustomerMutation, useUpdateCustomerMutation } from "../hooks/use-customers";

type CustomerFormValues = {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

const emptyValues: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
};

export function CreateCustomerDialog({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const createCustomerMutation = useCreateCustomerMutation();

  return (
    <CustomerFormDialog
      trigger={trigger}
      title={t("customers.form.createTitle")}
      submitLabel={t("customers.form.create")}
      successMessage={t("customers.form.created")}
      initialValues={emptyValues}
      isPending={createCustomerMutation.isPending}
      onSubmit={(input, callbacks) => createCustomerMutation.mutate(input, callbacks)}
    />
  );
}

export function EditCustomerDialog({
  trigger,
  customer,
}: {
  trigger: ReactNode;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    notes: string | null;
  };
}) {
  const { t } = useTranslation();
  const updateCustomerMutation = useUpdateCustomerMutation(customer.id);

  return (
    <CustomerFormDialog
      trigger={trigger}
      title={t("customers.form.editTitle")}
      submitLabel={t("customers.form.save")}
      successMessage={t("customers.form.saved")}
      initialValues={{
        name: customer.name,
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        company: customer.company ?? "",
        notes: customer.notes ?? "",
      }}
      isPending={updateCustomerMutation.isPending}
      onSubmit={(input, callbacks) => updateCustomerMutation.mutate(input, callbacks)}
    />
  );
}

function CustomerFormDialog({
  trigger,
  title,
  submitLabel,
  successMessage,
  initialValues,
  isPending,
  onSubmit,
}: {
  trigger: ReactNode;
  title: string;
  submitLabel: string;
  successMessage: string;
  initialValues: CustomerFormValues;
  isPending: boolean;
  onSubmit: (
    input: {
      name: string;
      email: string | null;
      phone: string | null;
      company: string | null;
      notes: string | null;
    },
    callbacks: { onError: (error: unknown) => void; onSuccess: () => void },
  ) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialValues);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      setValues(initialValues);
    }
  }

  function setValue<Key extends keyof CustomerFormValues>(key: Key, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.name.trim()) {
      return;
    }

    onSubmit(
      {
        name: values.name.trim(),
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        company: values.company.trim() || null,
        notes: values.notes.trim() || null,
      },
      {
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : t("customers.form.fallbackError");
          toast.error(message);
        },
        onSuccess: () => {
          toast.success(successMessage);
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{t("customers.form.description")}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="customer-name">{t("customers.form.name")}</FieldLabel>
            <Input
              id="customer-name"
              value={values.name}
              required
              onChange={(event) => setValue("name", event.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="customer-email">{t("customers.form.email")}</FieldLabel>
              <Input
                id="customer-email"
                type="email"
                value={values.email}
                onChange={(event) => setValue("email", event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="customer-phone">{t("customers.form.phone")}</FieldLabel>
              <Input
                id="customer-phone"
                value={values.phone}
                onChange={(event) => setValue("phone", event.target.value)}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="customer-company">{t("customers.form.company")}</FieldLabel>
            <Input
              id="customer-company"
              value={values.company}
              onChange={(event) => setValue("company", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="customer-notes">{t("customers.form.notes")}</FieldLabel>
            <Textarea
              id="customer-notes"
              rows={3}
              value={values.notes}
              onChange={(event) => setValue("notes", event.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("customers.form.pending") : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
