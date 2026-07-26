import { Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  User,
  PlusSquare,
  ListChecks,
  Users,
  Coins,
  Wallet,
  ArrowDownToLine,
  Bell,
  Settings,
  Menu,
  X,
  Compass,
  LogOut,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { apiFetch, clearAuth, getStoredUser, onAuthChange } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { recruiterService } from "@/services/recruiterOpportunityService";
import {
  onboardingRedirectPath,
  recruiterOnboardingService,
} from "@/services/recruiterOnboardingService";

const navItems = [
  { to: "/recruiter", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/recruiter/profile", label: "Profile", icon: User },
  { to: "/recruiter/post-new", label: "Post New Opportunity", icon: PlusSquare },
  { to: "/recruiter/manage-posts", label: "My Opportunities", icon: ListChecks },
  { to: "/recruiter/applications", label: "Applications", icon: Users },
  { to: "/recruiter/messages", label: "Messages", icon: MessageSquare },
  { to: "/recruiter/unlock-earnings", label: "Candidate Contact Unlocks", icon: Coins },
  { to: "/recruiter/wallet", label: "Wallet", icon: Wallet },
  { to: "/recruiter/withdraw", label: "Withdrawals", icon: ArrowDownToLine },
  { to: "/recruiter/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/recruiter/notifications", label: "Notifications", icon: Bell },
  { to: "/recruiter/settings", label: "Account Settings", icon: Settings },
] as const;

function SidebarInner({
  onNavigate,
  userName,
  companyName,
  avatarUrl,
  unreadCount,
  messageUnreadCount,
}: {
  onNavigate?: () => void;
  userName?: string;
  companyName?: string;
  avatarUrl?: string | null;
  unreadCount?: number;
  messageUnreadCount?: number;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

      <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary font-semibold">
            {(userName ?? "R").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{userName ?? "Recruiter"}</p>
          <p className="truncate text-xs text-muted-foreground">
            Recruiter · {companyName ?? "Company"}
          </p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navItems.map((n) => {
          const exact = "exact" in n && n.exact;
          const active = exact
            ? pathname === n.to || pathname === `${n.to}/`
            : pathname === n.to || pathname.startsWith(`${n.to}/`);
          const Icon = n.icon;
          const badge =
            n.to === "/recruiter/notifications"
              ? unreadCount
              : n.to === "/recruiter/messages"
                ? messageUnreadCount
                : 0;
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
              <span className="truncate flex-1">{n.label}</span>
              {!!badge && badge > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={async () => {
            try {
              await apiFetch("/api/auth/logout", { method: "POST" });
            } catch {
              /* ignore */
            }
            clearAuth();
            onNavigate?.();
            window.location.href = "/login";
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );
}

export function RecruiterLayout({
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
  const [companyName, setCompanyName] = useState<string | undefined>(getStoredUser()?.company ?? undefined);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    return onAuthChange(() => {
      const user = getStoredUser();
      setUserName(user?.name);
      setCompanyName(user?.company ?? undefined);
    });
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("cb-token") : null;
    const user = getStoredUser();

    if (!token) {
      router.navigate({ to: "/login" });
      return;
    }

    if (user && user.role !== "opportunity_provider") {
      if (user.role === "admin") {
        router.navigate({ to: "/admin" });
      } else {
        router.navigate({ to: "/dashboard" });
      }
      return;
    }

    const pathname =
      typeof window !== "undefined" ? window.location.pathname : "";
    const isOnboardingRoute = pathname.startsWith("/recruiter/onboarding");

    if (user?.role === "opportunity_provider" && !isOnboardingRoute) {
      recruiterOnboardingService
        .status()
        .then((res) => {
          if (!res.data.can_access_dashboard) {
            router.navigate({ to: onboardingRedirectPath(res.data) });
          }
        })
        .catch(() => {
          router.navigate({ to: "/recruiter/onboarding" });
        });
    }

    recruiterService
      .dashboard()
      .then((res) => {
        if (res.data?.user?.name) setUserName(res.data.user.name);
        if (res.data?.user?.company) setCompanyName(res.data.user.company);
        if (res.data?.user?.profile_photo) setAvatarUrl(res.data.user.profile_photo);
      })
      .catch(() => {
        /* optional — often blocked until onboarding is complete */
      });

    recruiterService
      .unreadNotifications()
      .then((res) => setUnreadCount(res.data.unread_count ?? 0))
      .catch(() => setUnreadCount(0));

    recruiterService
      .conversations({ per_page: 1 })
      .then((res) => setMessageUnreadCount(Number(res.data?.unread_count ?? 0)))
      .catch(() => setMessageUnreadCount(0));
  }, [router]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-border bg-surface">
        <SidebarInner
          userName={userName}
          companyName={companyName}
          avatarUrl={avatarUrl}
          unreadCount={unreadCount}
          messageUnreadCount={messageUnreadCount}
        />
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-surface border-r border-border shadow-card-hover">
            <SidebarInner
              userName={userName}
              companyName={companyName}
              avatarUrl={avatarUrl}
              unreadCount={unreadCount}
              messageUnreadCount={messageUnreadCount}
              onNavigate={() => setOpen(false)}
            />
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
                <h1 className="truncate font-display text-lg sm:text-xl font-bold tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="truncate text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" className="relative hidden sm:inline-flex">
                <Link to="/recruiter/notifications" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </Link>
              </Button>
              <ThemeToggle />
              <div className="hidden sm:block">{actions}</div>
            </div>
          </div>
          {actions && <div className="sm:hidden border-t border-border px-4 py-3">{actions}</div>}
        </header>

        <main className="px-4 sm:px-6 py-6 pb-16">{children}</main>
      </div>
    </div>
  );
}

export function RecruiterOutlet() {
  return <Outlet />;
}
