"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUnit } from "@/lib/api/units";
import { queryKeys } from "@/lib/api/query-keys";
import {
  DEMO_TENANCY_SUBTITLE,
  demoDocuments,
  demoIssues,
  demoLedgerEntries,
} from "@/lib/app/tenancy-demo-data";

type TenancyDashboardViewProps = {
  unitId: string;
};

const tabs = ["overview", "ledger", "issues", "documents"] as const;

export function TenancyDashboardView({ unitId }: TenancyDashboardViewProps) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("overview");

  const unitQuery = useQuery({
    queryKey: queryKeys.unit(unitId),
    queryFn: () => getUnit(unitId),
  });

  const unit = unitQuery.data;

  const headerLine = unit
    ? `${unit.building.property.name}, unit ${unit.number}${unit.contract ? ` · ${unit.contract.name}` : ""}`
    : "Loading…";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={unit ? `/properties/${unit.building.property.id}` : "/"}
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to property
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Tenancy dashboard</h2>
            <p className="text-muted-foreground mt-1 text-sm">{headerLine}</p>
          </div>
          <Badge variant="outline" className="w-fit border-amber-300 text-amber-800 dark:text-amber-200">
            {DEMO_TENANCY_SUBTITLE}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {tabs.map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={tab === t ? "default" : "ghost"}
            className="capitalize"
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rent breakdown</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>Cold rent, operating costs, and heating are demo values.</p>
              <div className="text-foreground flex justify-between border-t border-border pt-3 font-medium">
                <span>Total </span>
                <span>€1,050.00</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">€0.00</p>
              <Badge className="mt-2 border-0 bg-teal-100 text-teal-800">Up to date</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tenancy info</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>
                <span className="text-foreground font-medium">Unit:</span> {unit?.number ?? "—"}
              </p>
              <p>
                <span className="text-foreground font-medium">Contract:</span>{" "}
                {unit?.contract?.name ?? "None (vacant)"}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "ledger" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ledger (demo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/40 border-b text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {demoLedgerEntries.map((row) => (
                    <tr key={row.id} className="border-border border-b last:border-0">
                      <td className="text-muted-foreground px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2">{row.type}</td>
                      <td className="text-muted-foreground px-3 py-2">{row.category}</td>
                      <td className="text-muted-foreground px-3 py-2">{row.description}</td>
                      <td className="px-3 py-2 text-right font-medium">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "issues" ? (
        <div className="space-y-4">
          {demoIssues.map((issue) => (
            <Card key={issue.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{issue.title}</p>
                    <p className="text-muted-foreground text-xs">Reported by {issue.reporter} · {issue.date}</p>
                  </div>
                  <Badge variant="secondary">{issue.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "documents" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demoDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="text-base">{doc.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                <p>
                  {doc.type} · {doc.size}
                </p>
                <p className="mt-1">v{doc.version} · {doc.updated}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
