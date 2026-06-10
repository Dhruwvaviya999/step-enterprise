import { redirect } from "next/navigation";
import { Boxes, ShieldCheck, TrendingUp } from "lucide-react";

import { getCurrentUser } from "@/lib/session";
import { BrandLogo, BrandMark } from "@/components/brand-logo";

const HIGHLIGHTS = [
  {
    icon: Boxes,
    title: "Unified inventory",
    desc: "Brands, products and stock in one place.",
  },
  {
    icon: TrendingUp,
    title: "Live stock movements",
    desc: "Track every in and out as it happens.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    desc: "Super Admin controls who sees what.",
  },
];

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Signed-in users have no business on the auth pages
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* ── Brand panel (desktop only) ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-zinc-50 lg:flex">
        {/* subtle grid + glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-emerald-500/20 blur-3xl"
        />

        <div className="relative flex items-center gap-2">
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight">Stocker</span>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight">
              Inventory management that keeps up with your business.
            </h2>
            <p className="max-w-sm text-sm text-zinc-400">
              The simplest way for your team to track stock, brands and movements
              — on the web or installed on your phone.
            </p>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Icon className="size-4.5 text-emerald-400" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-sm text-zinc-400">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">
          © {new Date().getFullYear()} Stocker. All rights reserved.
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          {/* mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
