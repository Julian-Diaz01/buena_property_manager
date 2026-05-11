/**
 * Demo-only tenancy data (ledger, issues, documents).
 */
export const DEMO_TENANCY_SUBTITLE = "Demo data";

export const demoLedgerEntries = [
  {
    id: "1",
    date: "Feb 1, 2026",
    type: "Payment" as const,
    category: "Rent",
    amount: "€999.00",
    description: "Monthly rent payment",
    balance: "€0.00",
  },
  {
    id: "2",
    date: "Feb 1, 2026",
    type: "Charge" as const,
    category: "Rent",
    amount: "-€999.00",
    description: "Rent for February 2026",
    balance: "-€999.00",
  },
];

export const demoIssues = [
  {
    id: "1",
    title: "Heating not working",
    status: "In Progress",
    date: "Feb 15, 2026",
    reporter: "Tenant",
  },
  {
    id: "2",
    title: "Broken window latch",
    status: "Resolved",
    date: "Feb 10, 2026",
    reporter: "Tenant",
  },
];

export const demoDocuments = [
  {
    id: "1",
    name: "Rental Contract",
    type: "PDF",
    version: 2,
    size: "245 KB",
    updated: "Feb 15, 2026",
  },
  {
    id: "2",
    name: "Move-in Protocol",
    type: "PDF",
    version: 1,
    size: "892 KB",
    updated: "Jan 1, 2025",
  },
];
