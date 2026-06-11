import type { UserRole } from "@prisma/client";
import {
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  History,
  Layers,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for the company dashboard navigation.
 *
 * Consumed by the desktop sidebar, the mobile drawer (same Sidebar component),
 * the header page-title/breadcrumb, and active-link highlighting. Keeping it
 * here means a route only has to be declared once.
 */

const ALL_ROLES: UserRole[] = ["ADMIN", "MANAGER", "STAFF"];

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles allowed to see this entry. Mirrors the CLAUDE.md role matrix. */
  roles: UserRole[];
  /** Match the path exactly instead of by prefix (used for the dashboard root). */
  exact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const DASHBOARD_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ALL_ROLES,
        exact: true,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      { href: "/dashboard/products", label: "Products", icon: Package, roles: ALL_ROLES },
      { href: "/dashboard/brands", label: "Brands", icon: Tag, roles: ALL_ROLES },
      { href: "/dashboard/categories", label: "Categories", icon: Layers, roles: ALL_ROLES },
      { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck, roles: ALL_ROLES },
      {
        href: "/dashboard/purchase-orders",
        label: "Purchase Orders",
        icon: ClipboardList,
        roles: ALL_ROLES,
      },
      {
        href: "/dashboard/sales-orders",
        label: "Sales Orders",
        icon: ShoppingCart,
        roles: ALL_ROLES,
      },
      {
        href: "/dashboard/transfers",
        label: "Transfers",
        icon: ArrowLeftRight,
        roles: ALL_ROLES,
      },
      { href: "/dashboard/history", label: "Stock History", icon: History, roles: ALL_ROLES },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        href: "/dashboard/reports",
        label: "Reports",
        icon: BarChart3,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/dashboard/users", label: "Users", icon: Users, roles: ["ADMIN"] },
      { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

/** Flat list of every nav item, regardless of group or role. */
export const DASHBOARD_NAV_ITEMS: NavItem[] = DASHBOARD_NAV.flatMap((g) => g.items);

/** Whether `href` should be highlighted for the current `pathname`. */
export function isNavItemActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

/** Nav groups filtered down to the items a given role may see. */
export function navGroupsForRole(role: UserRole): NavGroup[] {
  return DASHBOARD_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

/**
 * Human-readable title for the current route, used by the header. Picks the
 * most specific (longest) matching nav href so e.g. nested detail routes still
 * resolve to their parent module's label.
 */
export function getPageTitle(pathname: string): string {
  let best: NavItem | undefined;
  for (const item of DASHBOARD_NAV_ITEMS) {
    if (isNavItemActive(pathname, item.href, item.exact)) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best?.label ?? "Dashboard";
}
