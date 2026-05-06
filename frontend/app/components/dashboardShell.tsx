import Link from "next/link";
import { Building2, Home, LogOut, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <main className="flex min-h-screen w-full bg-card">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar px-5 py-6 lg:flex lg:flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-foreground p-2 text-background">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-sidebar-foreground">
              Propertly
            </p>
            <p className="text-xs text-muted-foreground">Berlin</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground"
          >
            <Home className="h-4 w-4" />
            Properties
          </button>
        </nav>

        <div className="mt-auto space-y-4">

          <div className=" border-b border-b-border/80 border-t border-t-border/80">
            <div className="px-3 py-4">
              <div className="flex items-start gap-3">
                  <Image src="/user.png" alt="User" width={40} height={40} className="rounded-full shadow-md" />
                <div>
                  <p className="text-sm font-medium">Mr. Landlord</p>
                  <Badge variant="outline" className="mt-1 text-xs text-muted-foreground bg-muted">
                    Landlord
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Button asChild variant="ghost" className="w-full text-sm">
            <Link href="/">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Link>
          </Button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-secondary/50">
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your properties and tenancies
            </p>
          </div>
          <Button className="hidden h-10 sm:inline-flex">
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </header>

        <div className="flex-1 px-6 py-5">{children}</div>
      </section>
    </main>
  );
}

export function DashboardPlaceholder() {
  return (
   <div>
    <h1>This is a table.</h1>
   </div>
  );
}
