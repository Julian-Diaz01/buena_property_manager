"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUnit } from "@/lib/api/units";
import { queryKeys } from "@/lib/api/query-keys";

type TenancyDashboardViewProps = {
  unitId: string;
};


export function TenancyDashboardView({ unitId }: TenancyDashboardViewProps) {

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
            Demo data
          </Badge>
        </div>
      </div>

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
    </div>
  );
}
