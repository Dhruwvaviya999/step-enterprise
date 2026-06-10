"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  user: {
    name?: string | null;
    username?: string | null;
    role: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const label = user.name || user.username || "User";

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Badge variant="secondary" className="font-normal">
              {user.role}
            </Badge>
          </div>

          <ThemeToggle />

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
