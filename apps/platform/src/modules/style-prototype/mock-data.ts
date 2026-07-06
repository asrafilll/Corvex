// PROTOTYPE — throwaway mock data for /prototype-styles. Delete with the route.

export const project = {
  name: "Nimbus CRM Revamp",
  description:
    "Full rebuild of the Northwind customer portal: new CRM screens, billing integration, and an internal reporting dashboard.",
  status: "Active" as const,
  startDate: "2026-05-12",
  deadline: "2026-09-30",
  budgetAmount: "24000.00",
  currency: "USD",
  customer: {
    name: "Northwind Studio",
    company: "Northwind GmbH",
    email: "petra@northwind.example",
  },
};

export type MockTask = {
  id: string;
  title: string;
  status: "Todo" | "InProgress" | "Done" | "Cancelled";
  priority: "None" | "Low" | "Medium" | "High" | "Urgent";
  dueDate: string | null;
};

export const tasks: MockTask[] = [
  {
    id: "t1",
    title: "Auth flow with magic links",
    status: "Done",
    priority: "High",
    dueDate: null,
  },
  {
    id: "t2",
    title: "Customer list + detail screens",
    status: "Done",
    priority: "Medium",
    dueDate: null,
  },
  {
    id: "t3",
    title: "Billing webhook handler",
    status: "InProgress",
    priority: "Urgent",
    dueDate: "2026-07-11",
  },
  {
    id: "t4",
    title: "Invoice PDF generation",
    status: "InProgress",
    priority: "High",
    dueDate: "2026-07-18",
  },
  {
    id: "t5",
    title: "Reporting dashboard charts",
    status: "Todo",
    priority: "Medium",
    dueDate: "2026-08-02",
  },
  {
    id: "t6",
    title: "Role-based permissions",
    status: "Todo",
    priority: "High",
    dueDate: "2026-08-09",
  },
  {
    id: "t7",
    title: "Data import from legacy CRM",
    status: "Todo",
    priority: "Low",
    dueDate: null,
  },
  { id: "t8", title: "Load testing + perf pass", status: "Todo", priority: "None", dueDate: null },
];

export const milestones = [
  { id: "m1", name: "Design sign-off", date: "2026-05-30", done: true },
  { id: "m2", name: "Core CRM beta", date: "2026-07-01", done: true },
  { id: "m3", name: "Billing live", date: "2026-08-15", done: false },
  { id: "m4", name: "Launch", date: "2026-09-30", done: false },
];

export const paidTotal = "9500.00";
export const outstanding = "14500.00";

export const notes = [
  {
    id: "n1",
    title: "Kickoff call notes",
    body: "Petra wants weekly Friday demos. Legacy CRM export is CSV only — plan the import around it.",
    updatedAt: "2026-06-28",
  },
  {
    id: "n2",
    title: "Billing provider decision",
    body: "Going with Stripe over Mollie: better invoicing API, Petra already has an account.",
    updatedAt: "2026-07-02",
  },
];

export const secrets = [
  { id: "s1", name: "STAGING_DB_URL", description: "Postgres on Hetzner staging box" },
  { id: "s2", name: "STRIPE_TEST_KEY", description: "Stripe test-mode secret key" },
  { id: "s3", name: "SMTP_PASSWORD", description: "Postmark transactional sender" },
];
