"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import type { UserRole } from "@prisma/client";
import {
  Bell,
  BarChart3,
  Boxes,
  ClipboardList,
  IdCard,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface HeaderUser {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

interface DashboardHeaderProps {
  user: HeaderUser;
}

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  roles: UserRole[];
  /** Match the path exactly instead of by prefix (used for the dashboard root). */
  exact?: boolean;
};

/* ─────────────────────────────────────────────────────────────
   Navigation — role-aware. Routes are scaffolded under /dashboard
   and will be filled in as those modules are built.
───────────────────────────────────────────────────────────── */
const ALL_ROLES: UserRole[] = ["ADMIN", "MANAGER", "STAFF"];

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    Icon: LayoutDashboard,
    roles: ALL_ROLES,
    exact: true,
  },
  { href: "/dashboard/products", label: "Products", Icon: Package, roles: ALL_ROLES },
  { href: "/dashboard/inventory", label: "Inventory", Icon: Boxes, roles: ALL_ROLES },
  {
    href: "/dashboard/purchase-orders",
    label: "Purchase Orders",
    Icon: ClipboardList,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/suppliers",
    label: "Suppliers",
    Icon: Truck,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    Icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
];

/* Account links shown in the profile dropdown / mobile sheet. */
type AccountItem = { href: string; label: string; Icon: LucideIcon; roles: UserRole[] };

const ACCOUNT_ITEMS: AccountItem[] = [
  { href: "/dashboard/profile", label: "My Profile", Icon: IdCard, roles: ALL_ROLES },
  {
    href: "/dashboard/change-password",
    label: "Change Password",
    Icon: KeyRound,
    roles: ALL_ROLES,
  },
  { href: "/dashboard/users", label: "Manage Users", Icon: Users, roles: ["ADMIN"] },
  { href: "/dashboard/settings", label: "Settings", Icon: Settings, roles: ["ADMIN"] },
];

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function getInitials(user: HeaderUser) {
  const source = user.name || user.username || "?";
  const parts = source.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]).join("");
  return initials.toUpperCase() || "?";
}

function isPathActive(pathname: string, href: string, exact?: boolean) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/* ─────────────────────────────────────────────────────────────
   NotificationBell — empty-ready placeholder.
   Wire `notifications` to a real source once the feature lands.
───────────────────────────────────────────────────────────── */
function NotificationBell() {
  // No notification backend yet — render the "all caught up" state.
  const unreadCount = 0;
  const hasUnread = unreadCount > 0;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
          />
        }
      >
        <Bell className="size-5" />
        {hasUnread && (
          <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-destructive ring-2 ring-background" />
        )}
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-foreground">
            Notifications
          </span>
          {hasUnread && (
            <Badge variant="secondary" className="text-[10px]">
              {unreadCount} new
            </Badge>
          )}
        </div>

        <Separator />

        <ScrollArea className="max-h-80">
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <Bell className="mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up!
            </p>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

/* ─────────────────────────────────────────────────────────────
   ProfileMenu — avatar dropdown (desktop)
───────────────────────────────────────────────────────────── */
function ProfileMenu({ user }: { user: HeaderUser }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = user.name || user.username || "User";
  const accountItems = ACCOUNT_ITEMS.filter((i) => i.roles.includes(user.role));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Account menu"
          />
        }
      >
        <Avatar className="size-8">
          {user.image ? <AvatarImage src={user.image} alt={label} /> : null}
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-9">
            {user.image ? <AvatarImage src={user.image} alt={label} /> : null}
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-semibold">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold text-foreground">
              {label}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user.role}
            </span>
          </div>
        </div>

        <DropdownMenuSeparator />

        {accountItems.map(({ href, label: itemLabel, Icon }) => (
          <DropdownMenuItem key={href} render={<Link href={href} />}>
            <Icon className="size-4 text-muted-foreground" /> {itemLabel}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Theme row — plain element so the menu stays open on toggle. */}
        <div className="flex items-center justify-between px-2 py-1.5 text-sm">
          <span className="flex items-center gap-2 text-foreground">
            Theme
            <span className="font-medium">{isDark ? "Dark" : "Light"}</span>
          </span>
          <ThemeToggle className="size-8" />
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─────────────────────────────────────────────────────────────
   MobileNav — full-parity sheet for phones / tablets
───────────────────────────────────────────────────────────── */
function MobileNav({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = user.name || user.username || "User";

  const navItems = NAV_ITEMS.filter((i) => i.roles.includes(user.role));
  const accountItems = ACCOUNT_ITEMS.filter((i) => i.roles.includes(user.role));

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side="right" className="w-80 gap-0 p-0">
        {/* Header */}
        <SheetHeader className="border-b pr-12">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              {user.image ? <AvatarImage src={user.image} alt={label} /> : null}
              <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col leading-tight">
              <SheetTitle className="truncate text-sm">{label}</SheetTitle>
              <SheetDescription className="truncate text-xs">
                {user.role}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <ScrollArea className="flex-1">
          <div className="px-2 pb-2">
            <p className="px-3 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Navigation
            </p>
            {navItems.map(({ href, label: itemLabel, Icon, exact }) => (
              <SheetClose
                key={href}
                render={<Link href={href} />}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isPathActive(pathname, href, exact)
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {itemLabel}
              </SheetClose>
            ))}

            <Separator className="my-2" />

            <p className="px-3 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Account
            </p>
            {accountItems.map(({ href, label: itemLabel, Icon }) => (
              <SheetClose
                key={href}
                render={<Link href={href} />}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon className="size-4 shrink-0" />
                {itemLabel}
              </SheetClose>
            ))}

            <Separator className="my-2" />

            {/* Theme */}
            <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                Theme
                <span className="font-medium">{isDark ? "Dark" : "Light"}</span>
              </span>
              <ThemeToggle className="size-8" />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <SheetFooter className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────────────────────────────────────────
   DashboardHeader
───────────────────────────────────────────────────────────── */
export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname();
  const navItems = NAV_ITEMS.filter((i) => i.roles.includes(user.role));

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-8xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="shrink-0">
          <BrandLogo />
        </Link>

        {/* Desktop nav links */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {navItems.map(({ href, label, Icon, exact }) => {
            const active = isPathActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex">
            <NotificationBell />
          </div>
          <div className="hidden lg:block">
            <ProfileMenu user={user} />
          </div>
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}
