"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Home, LogOut, Plus } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function titleFromPath(pathname: string): { title: string; subtitle: string } {
  if (pathname === "/" || pathname === "") {
  }
  if (pathname.includes("/properties/new")) {
    return { title: "Create property", subtitle: "Add buildings and units in a guided flow" };
  }
  if (/\/properties\/[^/]+\/buildings\/[^/]+$/.test(pathname)) {
    return { title: "Units", subtitle: "Manage units for this building" };
  }
  if (pathname.includes("/tenancies/")) {
    return { title: "Tenancy", subtitle: "Live unit data with demo financial modules" };
  }
  return { title: "Propertly", subtitle: "Property management" };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { title, subtitle } = titleFromPath(pathname);
  const isCreatePropertyPage = pathname.includes("/properties/new");
  const showHeaderAddProperty = pathname === "/" || pathname === "";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.metaKey && !e.ctrlKey && e.code === "KeyP") {
        e.preventDefault();
        router.push("/properties/new");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <main className="bg-card flex min-h-screen w-full">
      <aside className="border-border bg-sidebar hidden w-64 shrink-0 flex-col border-r px-5 py-6 lg:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-foreground text-background rounded-xl p-2">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sidebar-foreground text-base font-semibold">Propertly</p>
            <p className="text-muted-foreground text-xs">Berlin</p>
          </div>
        </div>

        <nav className="space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === "/" || pathname === ""
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-muted/60"
            }`}
          >
            <Home className="h-4 w-4" />
            Properties
          </Link>
        </nav>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <div className="flex items-start gap-3 px-1 py-2">
            <div>
              <div className="flex items-start gap-3">
                <Image src="/user.png" alt="User" width={40} height={40} className="rounded-full shadow-md" />
                <div>
                  <p className="text-sm font-medium">Property manager</p>
                  <Badge variant="outline" className="mt-1 text-xs text-muted-foreground bg-muted">
                    Manager
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <Button asChild variant="ghost" className="w-full text-sm">
            <Link href="/login">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Link>
          </Button>
        </div>
      </aside>

      <section className="bg-secondary/50 flex min-w-0 flex-1 flex-col">
        <div className="border-border flex gap-2 border-b px-4 py-2 lg:hidden">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Properties</Link>
          </Button>
          {!isCreatePropertyPage ? (
            <Button asChild size="sm">
              <Link href="/properties/new">New</Link>
            </Button>
          ) : null}
        </div>

        <div className="flex-1 px-4 py-5 sm:px-6">{children}</div>
      </section>
    </main>
  );
}
