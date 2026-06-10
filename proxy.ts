import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Pages reachable without a session.
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/super-admin/login"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  const path = nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => path === route || path.startsWith(route + "/"),
  );

  const homeFor = (r?: string) =>
    r === "SUPER_ADMIN" ? "/super-admin" : "/dashboard";

  // Logged-in users shouldn't sit on auth pages.
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL(homeFor(role), nextUrl));
  }

  // Unauthenticated users hitting a protected page → correct login.
  if (!isLoggedIn && !isPublicRoute) {
    const isSuperAdminArea = path.startsWith("/super-admin");
    const loginPath = isSuperAdminArea ? "/super-admin/login" : "/login";
    const loginUrl = new URL(loginPath, nextUrl);
    if (!isSuperAdminArea) loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

// API routes handle their own auth (via lib/session helpers), so they're
// excluded here along with static assets.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
