import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Gauge,
  LayoutGrid,
  LogOut,
  Map as MapIcon,
  ScrollText,
  Search,
  Settings as SettingsIcon,
  Shield,
  Truck,
  UserCircle2,
  Wallet,
  Bell,
} from "lucide-react";

import type { ComponentType, ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useSessionProfile } from "@/hooks/use-session";
import { initials, type AppRole } from "@/lib/tms";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "./notification-center";
import logoAsset from "@/assets/logo.png.asset.json";


interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV: Record<AppRole, { brand: string; items: NavItem[] }> = {
  admin: {
    brand: "BF101 TMS",
    items: [
      { to: "/dashboard", label: "Command Center", icon: LayoutGrid },
      { to: "/shippers", label: "Shipper Management", icon: Shield },
      { to: "/carriers", label: "Carrier Management", icon: Wallet },
      { to: "/loads", label: "Load Board", icon: Truck },
      { to: "/map", label: "Live Map", icon: MapIcon },
      { to: "/fleet", label: "Fleet Management", icon: Truck },
      { to: "/documents", label: "Documents", icon: FileText },
      { to: "/drivers", label: "Driver Management", icon: UserCircle2 },
      { to: "/notifications", label: "Alert Inbox", icon: Bell },
      { to: "/audit-logs", label: "Audit Logs", icon: ScrollText },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },

  shipper: {
    brand: "SHIPPER HUB",
    items: [
      { to: "/dashboard", label: "Shipper Command", icon: Gauge },
      { to: "/loads", label: "My Loads", icon: Truck },
      { to: "/map", label: "Live Map", icon: MapIcon },
      { to: "/documents", label: "Compliance Docs", icon: FileText },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
  carrier: {
    brand: "CARRIER DESK",
    items: [
      { to: "/dashboard", label: "Carrier Portal", icon: Gauge },
      { to: "/loads", label: "Load Tenders", icon: Truck },
      { to: "/map", label: "Live Map", icon: MapIcon },
      { to: "/documents", label: "Compliance Docs", icon: FileText },
      { to: "/fleet", label: "Fleet / Vehicles", icon: Truck },
      { to: "/drivers", label: "Driver Management", icon: UserCircle2 },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
};

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile } = useSessionProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role: AppRole = profile?.role ?? "admin";
  const nav = NAV[role];

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-black px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex flex-col gap-1">
            <img src={logoAsset.url} className="h-8 w-auto object-contain brightness-0 invert" />
          </Link>
          <div className="hidden h-6 w-px bg-white/20 md:block" />
        </div>
        <nav className="hidden items-center gap-4 lg:flex">
          {[
            { to: "/dashboard", label: "Dashboard" },
            { to: "/loads", label: "Load Board" },
            { to: "/documents", label: "Documents" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "border-b-2 pb-1 text-sm font-medium transition-colors whitespace-nowrap",
                pathname === item.to
                  ? "border-signal text-white"
                  : "border-transparent text-gray-400 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:gap-4">
          <div className="hidden lg:block">
            <NotificationCenter />
          </div>
          
          <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 xl:flex">
            <Search className="size-4 text-gray-400" />
            <span className="text-sm text-gray-400">Search loads...</span>
          </div>

          <Link
            to="/settings"
            className="hidden items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20 sm:flex"
          >
            <SettingsIcon className="size-3.5 lg:size-4" /> 
            <span className="hidden lg:inline">Settings</span>
          </Link>
          
          <div className="lg:hidden">
            <NotificationCenter />
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black p-1 pr-3">
            <span className="grid size-7 lg:size-8 place-items-center rounded-full bg-primary text-[10px] lg:text-xs font-bold text-primary-foreground shrink-0">
              {initials(profile?.full_name ?? "Operator")}
            </span>
            <span className="hidden text-xs font-semibold text-white md:inline truncate max-w-[80px]">
              {profile?.full_name?.split(' ')[0] || "Operator"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col justify-between bg-sidebar px-4 py-6 md:flex border-r border-sidebar-border">
          <div>
            <div className="px-3">
              <img src={logoAsset.url} className="h-10 w-auto object-contain mb-1" />
              <p className="label-mono text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">{nav.brand}</p>
            </div>
            <nav className="mt-8 space-y-0.5 overflow-y-auto max-h-[calc(100vh-22rem)] custom-scrollbar">
              {nav.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-xs px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className={cn("size-4", active ? "text-signal" : "opacity-70")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto pt-4 border-t border-sidebar-border/50 bg-sidebar/50 -mx-4 px-4 pb-4">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xs bg-sidebar-accent/30 mb-2">
              <UserCircle2 className="size-5 text-signal" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
                  {profile?.full_name || "Operator"}
                </p>
                <p className="label-mono text-[10px] text-sidebar-foreground/50">{role}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-xs px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-all hover:bg-signal hover:text-white group"
            >
              <LogOut className="size-4 transition-transform group-hover:-translate-x-1" /> 
              Sign Out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}