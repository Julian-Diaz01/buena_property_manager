"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, LogOut, Menu, Plus } from "lucide-react";
import Image from "next/image";

import { Dialog } from "radix-ui";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const APP_NAME = "Propertly";

function LogoImage({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-border/60 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-1 shadow-sm",
        className
      )}
    >
      <img
        src="/logo.png"
        alt="Propertly logo"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoImage />
      <div className="min-w-0">
        <p className="text-sidebar-foreground truncate text-base font-semibold">{APP_NAME}</p>
        <p className="text-muted-foreground text-xs">Berlin</p>
      </div>
    </div>
  );
}

function UserAndSignOut({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-border mt-auto space-y-3 border-t pt-4">
      <div className="flex items-start gap-3 px-1 py-2">
        <Image
          src="/user.png"
          alt="User"
          width={40}
          height={40}
          className="rounded-full shadow-md"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium">Property manager</p>
          <Badge variant="outline" className="bg-muted mt-1 text-xs text-muted-foreground">
            Manager
          </Badge>
        </div>
      </div>
      <Button asChild variant="ghost" className="w-full text-sm">
        <Link href="/login" onClick={onNavigate}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Link>
      </Button>
    </div>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
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
  );
}

function MobileDrawerNav({
  pathname,
  onNavigate,
  showNewProperty,
}: {
  pathname: string;
  onNavigate: () => void;
  showNewProperty: boolean;
}) {
  const linkBase =
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-muted/60";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
      <nav className="space-y-1">
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            pathname === "/" || pathname === ""
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-muted/60"
          )}
        >
          <Home className="h-4 w-4" />
          Properties
        </Link>
        {showNewProperty ? (
          <Link href="/properties/new" onClick={onNavigate} className={linkBase}>
            <Plus className="h-4 w-4" />
            New property
          </Link>
        ) : null}
      </nav>
      <UserAndSignOut onNavigate={onNavigate} />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isCreatePropertyPage = pathname.includes("/properties/new");
  const showNewPropertyInMenu = !isCreatePropertyPage;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <main className="bg-card flex min-h-screen w-full">
      <aside className="border-border bg-sidebar hidden w-64 shrink-0 flex-col border-r px-5 py-6 lg:flex">
        <div className="mb-8">
          <BrandMark />
        </div>

        <DesktopNav pathname={pathname} />

        <UserAndSignOut />
      </aside>

      <section className="bg-secondary/50 flex min-w-0 flex-1 flex-col">
        <header className="border-border flex items-center gap-3 border-b px-4 py-3 lg:hidden">
          <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <Dialog.Trigger
              className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay
                className={cn(
                  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/40"
                )}
              />
              <Dialog.Content
                className={cn(
                  "border-border bg-sidebar data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left fixed top-0 left-0 z-50 flex h-full w-[min(100%,20rem)] flex-col border-r p-5 shadow-lg duration-200"
                )}
              >
                <Dialog.Title className="sr-only">Main menu</Dialog.Title>
                <Dialog.Description className="sr-only">
                  App navigation, account, and sign out
                </Dialog.Description>
                <MobileDrawerNav
                  pathname={pathname}
                  onNavigate={() => setMobileMenuOpen(false)}
                  showNewProperty={showNewPropertyInMenu}
                />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <LogoImage className="h-9 w-9 rounded-lg" />
            <span className="text-foreground truncate text-base font-semibold">{APP_NAME}</span>
          </div>
        </header>

        <div className="flex-1 px-4 py-5 sm:px-6">{children}</div>
      </section>
    </main>
  );
}
