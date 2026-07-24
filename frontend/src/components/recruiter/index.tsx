import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BellDot,
  Briefcase,
  CheckCircle2,
  Clock,
  Coins,
  Eye,
  FileText,
  ListChecks,
  Plus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import {
  RecruiterEmptyState,
  RecruiterErrorState,
  RecruiterLoadingSkeleton,
  apiErrorMessage,
  asList,
} from "@/components/recruiter/shared";
import { Button } from "@/components/ui/button";
import {
  recruiterService,
  type RecruiterOpportunity,
} from "@/services/recruiterOpportunityService";

type DashboardApplication = {
  id: number;
  status?: string | null;
  rating?: number | null;
  applied_at?: string | null;
  created_at?: string | null;
  candidate?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    profile_photo?: string | null;
    photo?: string | null;
  } | null;
  opportunity?: {
    id?: number;
    title?: string | null;
    status?: string | null;
  } | null;
};

type DashboardEarning = {
  id: number;
  amount?: number | string | null;
  status?: string | null;
  unlocked_at?: string | null;
  created_at?: string | null;
  candidate?: {
    name?: string | null;
    profile_photo?: string | null;
  } | null;
  opportunity?: {
    title?: string | null;
  } | null;
};

type DashboardNotification = {
  id: number;
  title?: string | null;
  message?: string | null;
  body?: string | null;
  type?: string | null;
  is_read?: boolean;
  read?: boolean;
  created_at?: string | null;
};

type DashboardData = {
  user?: {
    name?: string | null;
    company?: string | null;
    current_role?: string | null;
    profile_photo?: string | null;
  } | null;
  stats?: {
    total_opportunities?: number | string | null;
    published_opportunities?: number | string | null;
    draft_opportunities?: number | string | null;
    closed_opportunities?: number | string | null;
    applications?: number | string | null;
    today_applications?: number | string | null;
    views?: number | string | null;
    unlock_earnings?: {
      today?: number | string | null;
      month?: number | string | null;
      lifetime?: number | string | null;
    } | null;
    wallet_balance?: number | string | null;
    pending_withdrawals?: number | string | null;
  } | null;
  recent_applications?: DashboardApplication[];
  recent_posts?: RecruiterOpportunity[];
  recent_earnings?: DashboardEarning[];
  notifications?: DashboardNotification[];
  unread_notifications?: number;
};

const cardBase = "rounded-2xl border border-border bg-card shadow-card";

export function RecruiterDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await recruiterService.dashboard();
      setDashboard((res.data as DashboardData) ?? null);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load recruiter dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard?.stats;
  const statCards = useMemo(
    () => [
      {
        label: "Total Opportunities",
        value: formatNumber(stats?.total_opportunities),
        detail: "All posts created",
        icon: Briefcase,
        tint: "text-primary bg-primary-soft",
      },
      {
        label: "Published",
        value: formatNumber(stats?.published_opportunities),
        detail: "Live opportunities",
        icon: CheckCircle2,
        tint: "text-secondary bg-secondary-soft",
      },
      {
        label: "Drafts",
        value: formatNumber(stats?.draft_opportunities),
        detail: "Saved drafts",
        icon: FileText,
        tint: "text-muted-foreground bg-muted",
      },
      {
        label: "Closed",
        value: formatNumber(stats?.closed_opportunities),
        detail: "Closed posts",
        icon: Clock,
        tint: "text-destructive bg-destructive/10",
      },
      {
        label: "Applications",
        value: formatNumber(stats?.applications),
        detail: `${formatNumber(stats?.today_applications)} today`,
        icon: Users,
        tint: "text-secondary bg-secondary-soft",
      },
      {
        label: "Today Applications",
        value: formatNumber(stats?.today_applications),
        detail: "New today",
        icon: Plus,
        tint: "text-primary bg-primary-soft",
      },
      {
        label: "Views",
        value: formatNumber(stats?.views),
        detail: "Total post views",
        icon: Eye,
        tint: "text-accent bg-accent-soft",
      },
      {
        label: "Unlock Earnings",
        value: formatCurrency(stats?.unlock_earnings?.today),
        detail: `${formatCurrency(stats?.unlock_earnings?.month)} this month`,
        icon: Coins,
        tint: "text-accent bg-accent-soft",
      },
      {
        label: "Wallet Balance",
        value: formatCurrency(stats?.wallet_balance),
        detail: "Available balance",
        icon: Wallet,
        tint: "text-primary bg-primary-soft",
      },
      {
        label: "Pending Withdrawals",
        value: formatCurrency(stats?.pending_withdrawals),
        detail: "Awaiting payout",
        icon: ArrowDownToLine,
        tint: "text-muted-foreground bg-muted",
      },
    ],
    [stats],
  );

  const recentApplications = asList<DashboardApplication>(dashboard?.recent_applications);
  const recentPosts = asList<RecruiterOpportunity>(dashboard?.recent_posts);
  const recentEarnings = asList<DashboardEarning>(dashboard?.recent_earnings);
  const notifications = asList<DashboardNotification>(dashboard?.notifications);
  const user = dashboard?.user;
  const initials = getInitials(user?.name ?? "Recruiter");

  return (
    <RecruiterLayout
      title="Dashboard"
      subtitle="Overview of your hiring activity"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/recruiter/post-new">
            <Plus className="h-4 w-4" /> Post Opportunity
          </Link>
        </Button>
      }
    >
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <RecruiterErrorState message={error} onRetry={loadDashboard} />
      ) : (
        <>
          <section className="relative overflow-hidden rounded-2xl border border-border gradient-hero p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {user?.profile_photo ? (
                  <img
                    src={user.profile_photo}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/30"
                  />
                ) : (
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-lg font-semibold text-primary ring-2 ring-primary/30">
                    {initials}
                  </span>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Welcome back</p>
                  <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {user?.name ?? "Recruiter"}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {user?.company || user?.current_role || "Recruiter workspace"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft px-2 py-0.5 text-xs font-medium text-secondary">
                      <CheckCircle2 className="h-3 w-3" /> API connected
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/recruiter/manage-posts">Manage posts</Link>
                </Button>
                <Button asChild size="sm" variant="brand">
                  <Link to="/recruiter/applications">Review applications</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={`${cardBase} p-5`}>
                  <div className="flex items-start justify-between">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
                </div>
              );
            })}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={`${cardBase} lg:col-span-2`}>
              <SectionHeader
                title="Recent Applications"
                link="/recruiter/applications"
                linkLabel="View all"
              />
              {recentApplications.length === 0 ? (
                <InlineEmpty title="No recent applications" />
              ) : (
                <ul className="divide-y divide-border">
                  {recentApplications.map((application) => (
                    <li key={application.id} className="flex items-center gap-3 px-5 py-3">
                      <CandidateAvatar
                        name={application.candidate?.name}
                        photo={application.candidate?.profile_photo ?? application.candidate?.photo}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {application.candidate?.name ?? "Candidate"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {application.opportunity?.title ?? "Opportunity"} -{" "}
                          {formatDate(application.applied_at ?? application.created_at)}
                        </p>
                      </div>
                      <StatusPill status={application.status ?? "new"} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={cardBase}>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="font-semibold">Notifications</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {dashboard?.unread_notifications ?? 0} unread
                  <BellDot className="h-4 w-4" />
                </div>
              </div>
              {notifications.length === 0 ? (
                <InlineEmpty title="No notifications" />
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.slice(0, 6).map((notification) => (
                    <li key={notification.id} className="px-5 py-3">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {notification.title ?? "Notification"}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {notification.message ?? notification.body ?? "No details provided."}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        {!(notification.is_read ?? notification.read) && (
                          <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={`${cardBase} lg:col-span-2`}>
              <SectionHeader
                title="Recent Posts"
                link="/recruiter/manage-posts"
                linkLabel="Manage"
              />
              {recentPosts.length === 0 ? (
                <InlineEmpty title="No posts yet" />
              ) : (
                <ul className="divide-y divide-border">
                  {recentPosts.map((post) => (
                    <li key={post.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                        <Briefcase className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{post.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {post.company_name || "Company"} - {formatNumber(post.applications_count)}{" "}
                          apps - {formatNumber(post.views)} views
                        </p>
                      </div>
                      <PostStatusPill status={post.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={cardBase}>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="font-semibold">Recent Earnings</h3>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </div>
              {recentEarnings.length === 0 ? (
                <InlineEmpty title="No earnings yet" />
              ) : (
                <ul className="divide-y divide-border">
                  {recentEarnings.map((earning) => (
                    <li key={earning.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {earning.candidate?.name ?? "Candidate"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {earning.opportunity?.title ?? "Opportunity"}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDate(earning.unlocked_at ?? earning.created_at)}
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold text-secondary">
                          {formatCurrency(earning.amount)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-card-hover"
                  >
                    <span className={`grid h-11 w-11 place-items-center rounded-xl ${action.tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </RecruiterLayout>
  );
}

const quickActions = [
  {
    label: "Post New",
    description: "Create an opportunity",
    to: "/recruiter/post-new",
    icon: Plus,
    tint: "bg-primary-soft text-primary",
  },
  {
    label: "Manage Posts",
    description: "Edit active listings",
    to: "/recruiter/manage-posts",
    icon: ListChecks,
    tint: "bg-secondary-soft text-secondary",
  },
  {
    label: "Applications",
    description: "Review candidates",
    to: "/recruiter/applications",
    icon: Users,
    tint: "bg-accent-soft text-accent-foreground",
  },
  {
    label: "Withdraw",
    description: "Request payout",
    to: "/recruiter/withdraw",
    icon: ArrowDownToLine,
    tint: "bg-muted text-muted-foreground",
  },
] as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <RecruiterLoadingSkeleton rows={1} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <RecruiterLoadingSkeleton rows={10} className="contents" />
      </div>
      <RecruiterLoadingSkeleton rows={6} />
    </div>
  );
}

function SectionHeader({
  title,
  link,
  linkLabel,
}: {
  title: string;
  link: "/recruiter/applications" | "/recruiter/manage-posts";
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <h3 className="font-semibold">{title}</h3>
      <Button asChild variant="ghost" size="sm">
        <Link to={link}>{linkLabel}</Link>
      </Button>
    </div>
  );
}

function InlineEmpty({ title }: { title: string }) {
  return (
    <div className="p-5">
      <RecruiterEmptyState title={title} description="New activity will appear here." />
    </div>
  );
}

function CandidateAvatar({ name, photo }: { name?: string | null; photo?: string | null }) {
  if (photo) {
    return <img src={photo} alt="" className="h-10 w-10 rounded-full object-cover" />;
  }

  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
      {getInitials(name ?? "C")}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const map: Record<string, string> = {
    new: "bg-primary-soft text-primary",
    shortlisted: "bg-secondary-soft text-secondary",
    interview: "bg-accent-soft text-accent-foreground",
    rejected: "bg-destructive/10 text-destructive",
    hired: "bg-secondary-soft text-secondary",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        map[normalized] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {titleCase(status)}
    </span>
  );
}

function PostStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const map: Record<string, string> = {
    published: "bg-secondary-soft text-secondary",
    draft: "bg-muted text-muted-foreground",
    paused: "bg-accent-soft text-accent-foreground",
    closed: "bg-destructive/10 text-destructive",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        map[normalized] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {titleCase(status)}
    </span>
  );
}

function formatNumber(value?: number | string | null) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "0";
  return new Intl.NumberFormat("en-IN").format(number);
}

function formatCurrency(value?: number | string | null) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "Rs 0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(value?: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
