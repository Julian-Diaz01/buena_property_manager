"use client";

import Link from "next/link";
import { Building2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginCard() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="rounded-xl bg-primary p-3 text-primary-foreground shadow-sm">
          <Building2 className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Propertly</h1>
        <p className="text-base text-muted-foreground">
          Shared source of truth for tenancies
        </p>
      </div>

      <Card className="w-full max-w-md border-border/90">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              defaultValue="demo@propertly.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" defaultValue="password" />
          </div>

          <Button asChild className="h-11 w-full text-sm font-semibold">
            <Link href="/">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
