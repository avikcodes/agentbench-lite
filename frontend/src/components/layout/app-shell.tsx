"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Database, FlaskConical, Home, Menu, Play, Sparkles, Trophy, X } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/run", label: "Run Benchmark", icon: FlaskConical },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/analytics", label: "Analytics", icon: Sparkles },
  { href: "/replay", label: "Replay", icon: Play },
  { href: "/models", label: "Models", icon: Home },
  { href: "/datasets", label: "Datasets", icon: Database },
];

function Sidebar({
  pathname,
  mobile,
  onNavigate,
}: {
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <aside
      className={cn(
        "flex h-full w-[280px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
        mobile ? "rounded-r-3xl shadow-2xl" : "",
      )}
    >
      <div className="border-b border-sidebar-border px-6 py-6">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-sidebar-primary px-3 py-1 text-xs font-semibold tracking-[0.22em] text-sidebar-primary-foreground uppercase">
            AgentBench Lite
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Research Dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-sidebar-foreground/72">
              Run, compare, and inspect benchmark performance across models and datasets.
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/78 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <Card className="rounded-3xl border-sidebar-border bg-sidebar-accent px-4 py-4 text-sidebar-accent-foreground shadow-none">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Backend link</p>
              <StatusBadge status="idle" />
            </div>
            <p className="text-sm leading-6 text-sidebar-accent-foreground/75">
              Requests are proxied through Next so the dashboard can talk to FastAPI without browser CORS issues.
            </p>
          </div>
        </Card>
      </div>
    </aside>
  );
}

function TopBar({
  title,
  onOpenMenu,
}: {
  title: string;
  onOpenMenu: () => void;
}) {
  return (
    <div className="surface sticky top-4 z-20 flex items-center justify-between rounded-3xl px-4 py-4">
      <div className="flex items-center gap-3">
        <Button className="lg:hidden" variant="outline" size="icon" onClick={onOpenMenu}>
          <Menu className="size-4" />
        </Button>
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Navigation
          </p>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status="healthy" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeItem = navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <div className="min-h-screen lg:flex">
      <div className="hidden lg:block">
        <Sidebar pathname={pathname} />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/35 lg:hidden">
          <div className="flex h-full">
            <Sidebar pathname={pathname} mobile onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              className="flex-1"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            />
            <Button
              className="absolute top-4 right-4"
              variant="secondary"
              size="icon"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <main className="min-h-screen flex-1 p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <TopBar
            title={activeItem?.label ?? "AgentBench Lite"}
            onOpenMenu={() => setMobileOpen(true)}
          />
          <div>{children}</div>
        </div>
      </main>
    </div>
  );
}
