import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Bot, Library, History, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brand } from "@/components/brand";
import { useWorkspace } from "@/hooks/use-workspace";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Workspace — OpsAtlas AI" }, { name: "description", content: "Your OpsAtlas AI operations workspace." }] }),
  component: AppShell,
});

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/agent", label: "Agent Workspace", icon: Bot },
  { to: "/app/knowledge", label: "Knowledge Base", icon: Library },
  { to: "/app/runs", label: "Agent Runs", icon: History },
] as const;

function AppShell() {
  const ws = useWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5"><Brand /></div>
      <div className="mx-3 mb-4 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Workspace</p>
        <p className="truncate text-sm font-medium">{ws.data?.name ?? "…"}</p>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }} onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-foreground">
            <n.icon className="h-4 w-4" />{n.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground">
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-background/70" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-sidebar-border bg-sidebar">{sidebar}</aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex h-14 items-center border-b border-border px-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
          <div className="ml-3"><Brand /></div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
