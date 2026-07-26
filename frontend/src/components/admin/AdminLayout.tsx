import { Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Clock3,
  CheckCircle2,
  XCircle,
  UsersRound,
  GraduationCap,
  Settings,
  Menu,
  X,
  Compass,
  LogOut,
  ChevronDown,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { clearAuth, getStoredUser, onAuthChange } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    label: "Recruiters",
    icon: Briefcase,
    children: [
      { to: "/admin/recruiters?status=Pending", label: "Pending", icon: Clock3 },
      { to: "/admin/recruiters?status=Approved", label: "Approved", icon: CheckCircle2 },
      { to: "/admin/recruiters?status=Rejected", label: "Rejected", icon: XCircle },
      { to: "/admin/recruiters", label: "All Recruiters", icon: Briefcase },
    ],
  },
  { to: "/admin/mentors", label: "Mentors", icon: GraduationCap },
  { to: "/admin/job-seekers", label: "Job Seekers", icon: UsersRound },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function SidebarInner({ onNavigate, userName }: { onNavigate?: () => void; userName?: string }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const [recruitersOpen, setRecruitersOpen] = useState(true);

  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex shrink-0 items-center gap-2 px-5 h-16 border-b border-border">
        <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-card">
          <Compass className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">
          Career<span className="text-primary">Bridge</span>
        </span>
      </Link>

      <div className="mx-4 mt-4 rounded-xl border border-border bg-muted/40 p-3">
        <p className="text-sm font-semibold">{userName ?? "Admin"}</p>
        <p className="text-xs text-muted-foreground">Platform Admin</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          if ("children" in item) {
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setRecruitersOpen((v) => !v)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/60"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown className={cn("h-4 w-4 transition", recruitersOpen && "rotate-180")} />
                </button>
                {recruitersOpen && (
                  <div className="ml-3 space-y-1 border-l border-border pl-3">
                    {item.children.map((child) => {
                      const status = child.to.includes("status=")
                        ? new URLSearchParams(child.to.split("?")[1]).get("status")
                        : null;
                      const active =
                        pathname.startsWith("/admin/recruiters") &&
                        !pathname.includes("/admin/recruiters/") &&
                        ((status && search.includes(`status=${status}`)) ||
                          (!status && !search.includes("status=")));
                      return (
                        <button
                          key={child.to}
                          type="button"
                          onClick={() => {
                            void router.navigate({
                              to: "/admin/recruiters",
                              search: status ? { status } : {},
                            });
                            onNavigate?.();
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                            active
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-muted-foreground hover:bg-muted/60",
                          )}
                        >
                          <child.icon className="h-3.5 w-3.5" />
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const exact = "exact" in item && item.exact;
          const active = exact
            ? pathname === "/admin" || pathname === "/admin/"
            : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => {
            clearAuth();
            window.location.href = "/login";
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function AdminLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState(getStoredUser()?.name);
  const router = useRouter();

  useEffect(() => onAuthChange(() => setUserName(getStoredUser()?.name)), []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("cb-token") : null;
    const user = getStoredUser();
    if (!token) {
      router.navigate({ to: "/login" });
      return;
    }
    if (user && user.role !== "admin") {
      router.navigate({ to: "/dashboard" });
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-border bg-surface">
        <SidebarInner userName={userName} />
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-surface shadow-card-hover">
            <SidebarInner userName={userName} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-display text-lg sm:text-xl font-bold tracking-tight">{title}</h1>
                {subtitle && <p className="truncate text-xs sm:text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden sm:block">{actions}</div>
            </div>
          </div>
        </header>
        <main className="px-4 sm:px-6 py-6 pb-16">{children}</main>
      </div>
    </div>
  );
}

export function AdminOutlet() {
  return <Outlet />;
}
