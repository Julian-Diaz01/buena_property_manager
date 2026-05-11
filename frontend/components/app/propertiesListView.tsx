"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listProperties } from "@/lib/api/properties";
import { queryKeys } from "@/lib/api/query-keys";
import type { PropertyListItem } from "@/lib/api/types";

function OccupancyBadge({ property }: { property: PropertyListItem }) {
  const { unitsCount, rentedUnitsCount } = property;
  if (unitsCount === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-dashed">
        No units
      </Badge>
    );
  }
  const full = rentedUnitsCount === unitsCount;
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">
        {rentedUnitsCount}/{unitsCount}
      </span>
      {full ? (
        <Badge className="border-0 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-100">Full</Badge>
      ) : (
        <Badge className="border-0 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100">
          Available
        </Badge>
      )}
    </div>
  );
}

export function PropertiesListView() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.properties,
    queryFn: () => listProperties(),
  });

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[12rem] items-center justify-center text-sm">
        Loading properties…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-6 text-sm">
        <p className="text-destructive font-medium">Could not load properties</p>
        <p className="text-muted-foreground mt-1">{error instanceof Error ? error.message : "Unknown error"}</p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/40 border-border border-b text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Units</th>
              <th className="px-4 py-3 font-medium">Occupancy</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-10 text-center">
                  No properties yet.{" "}
                  <Link href="/properties/new" className="text-primary font-medium underline-offset-4 hover:underline">
                    Create your first property
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              rows.map((property) => (
                <tr key={property.id} className="border-border hover:bg-muted/30 border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                        <Building2 className="text-muted-foreground h-5 w-5" />
                      </div>
                      <span className="font-medium">{property.name}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">{property.type}</td>
                  <td className="text-muted-foreground px-4 py-3">{property.unitsCount} units</td>
                  <td className="px-4 py-3">
                    <OccupancyBadge property={property} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/properties/${property.id}`}>View units</Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
