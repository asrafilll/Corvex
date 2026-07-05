export type CustomerListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  projectCount: number;
};

export type CustomerProject = {
  id: string;
  name: string;
  status: string;
  deadline: Date | null;
  budgetAmount: string | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomerDetail = CustomerListItem & {
  projects: CustomerProject[];
};
