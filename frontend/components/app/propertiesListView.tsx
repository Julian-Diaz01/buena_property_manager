"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, Users } from "lucide-react";

import { ShortcutActionLabel } from "@/components/app/shortcutActionLabel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listProperties } from "@/lib/api/properties";
import { queryKeys } from "@/lib/api/query-keys";
import type { PropertyListItem } from "@/lib/api/types";
import { useAltKeyAction } from "@/lib/app/use-alt-key-action";

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
  const router = useRouter();
  const goNewProperty = useCallback(() => {
    router.push("/properties/new");
  }, [router]);
  useAltKeyAction(true, "KeyP", goNewProperty);

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
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your property portfolio</p>
        </div>
        <Button asChild className="shrink-0 rounded-full px-5 font-semibold">
          <Link href="/properties/new">
            <Plus className="h-4 w-4" />
            Add property
            <ShortcutActionLabel shortcut="Alt+P" />
          </Link>
        </Button>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-muted/40 border-border border-b text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Property name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Buildings</th>
              <th className="px-4 py-3 font-medium">Total units</th>
              <th className="px-4 py-3 font-medium">Occupancy</th>
              <th className="px-4 py-3 font-medium">Management</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground px-4 py-10 text-center">
                  No properties yet.{" "}
                  <Link href="/properties/new" className="text-primary font-medium underline-offset-4 hover:underline">
                    Create your first property
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              rows.map((property) => {
                const nBuildings = property.buildingIds.length;
                return (
                  <tr key={property.id} className="border-border hover:bg-muted/30 border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                          <Building2 className="text-muted-foreground h-5 w-5" />
                        </div>
                        <span className="font-medium">{property.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-normal">
                        {property.type}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {nBuildings}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {property.unitsCount}
                    </td>
                    <td className="px-4 py-3">
                      <OccupancyBadge property={property} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 shrink-0" />
                        <div>
                          <div>{property.manager.fullName}</div>
                          <div className="text-muted-foreground/80 text-xs">{property.accountant.fullName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/properties/${property.id}`}>View buildings</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
