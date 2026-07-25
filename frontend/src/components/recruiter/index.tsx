import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BadgeCheck,
  BellDot,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock,
  Coins,
  Eye,
  FileText,
  ListChecks,
  Percent,
  Plus,
  TrendingUp,
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
  interview_at?: string | null;
  interview_link?: string | null;
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

type DashboardActivity = {
  type?: string | null;
  title?: string | null;
  description?: string | null;
  amount?: number | string | null;
  created_at?: string | null;
};

type TrendPoint = {
  date?: string;
  label?: string;
  applications?: number;
  views?: number;
};

type DashboardData = {
  user?: {
    name?: string | null;
    company?: string | null;
    current_role?: string | null;
    profile_photo?: string | null;
  } | null;
  profile_status?: {
    company_name?: string | null;
    recruiter_name?: string | null;
    recruiter_type?: string | null;
    approval_status?: string | null;
    profile_completion?: number | string | null;
    company_logo?: string | null;
    industry?: string | null;
  } | null;
  stats?: {
    total_opportunities?: number | string | null;
    published_opportunities?: number | string | null;
    draft_opportunities?: number | string | null;
    closed_opportunities?: number | string | null;
    open_positions?: number | string | null;
    applications?: number | string | null;
    today_applications?: number | string | null;
    views?: number | string | null;
    profile_completion?: number | string | null;
    unlock_earnings?: {
      today?: number | string | null;
      month?: number | string | null;
      lifetime?: number | string | null;
      pending?: number | string | null;
    } | null;
    contact_unlock_earnings?: number | string | null;
    wallet_balance?: number | string | null;
    pending_withdrawals?: number | string | null;
    monthly_earnings?: number | string | null;
    response_rate?: number | string | null;
    interview_invitations?: number | string | null;
    pipeline?: Record<string, number | string | null> | null;
  } | null;
  application_trends?: { days?: number; chart?: TrendPoint[] } | null;
  opportunity_performance?: RecruiterOpportunity[];
  most_viewed_opportunity?: RecruiterOpportunity | null;
  recent_applications?: DashboardApplication[];
  recent_posts?: RecruiterOpportunity[];
  recent_opportunities?: RecruiterOpportunity[];
  recent_earnings?: DashboardEarning[];
  recent_candidate_unlocks?: DashboardEarning[];
  upcoming_interviews?: DashboardApplication[];
  notifications?: DashboardNotification[];
  unread_notifications?: number;
  recent_activity?: DashboardActivity[];
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
  const profileStatus = dashboard?.profile_status;
  const statCards = useMemo(
    () => [
      {
        label: "Total Opportunities",
        value: formatNumber(stats?.total_opportunities),
        detail: "All posts created",
        icon: Briefcase,
        tint: "text-primary bg-primary-soft",
        to: "/recruiter/manage-posts" as const,
      },
      {
        label: "Published",
        value: formatNumber(stats?.published_opportunities),
        detail: "Live opportunities",
        icon: CheckCircle2,
        tint: "text-secondary bg-secondary-soft",
        to: "/recruiter/manage-posts" as const,
      },
      {
        label: "Drafts",
        value: formatNumber(stats?.draft_opportunities),
        detail: "Saved drafts",
        icon: FileText,
        tint: "text-muted-foreground bg-muted",
        to: "/recruiter/manage-posts" as const,
      },
      {
        label: "Closed",
        value: formatNumber(stats?.closed_opportunities),
        detail: "Closed posts",
        icon: Clock,
        tint: "text-destructive bg-destructive/10",
        to: "/recruiter/manage-posts" as const,
      },
      {
        label: "Open Positions",
        value: formatNumber(stats?.open_positions),
        detail: "Published + paused",
        icon: Briefcase,
        tint: "text-primary bg-primary-soft",
        to: "/recruiter/manage-posts" as const,
      },
      {
        label: "Applications",
        value: formatNumber(stats?.applications),
        detail: `${formatNumber(stats?.today_applications)} today`,
        icon: Users,
        tint: "text-secondary bg-secondary-soft",
        to: "/recruiter/applications" as const,
      },
      {
        label: "Today's Applications",
        value: formatNumber(stats?.today_applications),
        detail: "New today",
        icon: Plus,
        tint: "text-primary bg-primary-soft",
        to: "/recruiter/applications" as const,
      },
      {
        label: "Views",
        value: formatNumber(stats?.views),
        detail: "Total post views",
        icon: Eye,
        tint: "text-accent bg-accent-soft",
        to: "/recruiter/manage-posts" as const,
      },
      {
        label: "Profile Completion",
        value: `${formatNumber(stats?.profile_completion ?? profileStatus?.profile_completion)}%`,
        detail: "Company profile",
        icon: BadgeCheck,
        tint: "text-secondary bg-secondary-soft",
        to: "/recruiter/profile" as const,
      },
      {
        label: "Contact Unlock Earnings",
        value: formatCurrency(stats?.contact_unlock_earnings ?? stats?.unlock_earnings?.lifetime),
        detail: `${formatCurrency(stats?.unlock_earnings?.month)} this month`,
        icon: Coins,
        tint: "text-accent bg-accent-soft",
        to: "/recruiter/unlock-earnings" as const,
      },
      {
        label: "Wallet Balance",
        value: formatCurrency(stats?.wallet_balance),
        detail: "Available balance",
        icon: Wallet,
        tint: "text-primary bg-primary-soft",
        to: "/recruiter/wallet" as const,
      },
      {
        label: "Pending Withdrawals",
        value: formatCurrency(stats?.pending_withdrawals),
        detail: "Awaiting payout",
        icon: ArrowDownToLine,
        tint: "text-muted-foreground bg-muted",
        to: "/recruiter/withdraw" as const,
      },
      {
        label: "Monthly Earnings",
        value: formatCurrency(stats?.monthly_earnings ?? stats?.unlock_earnings?.month),
        detail: "Unlock income this month",
        icon: TrendingUp,
        tint: "text-secondary bg-secondary-soft",
        to: "/recruiter/unlock-earnings" as const,
      },
      {
        label: "Response Rate",
        value: `${formatNumber(stats?.response_rate)}%`,
        detail: "Acted applications",
        icon: Percent,
        tint: "text-primary bg-primary-soft",
        to: "/recruiter/applications" as const,
      },
      {
        label: "Interview Invitations",
        value: formatNumber(stats?.interview_invitations),
        detail: "In interview stage",
        icon: CalendarClock,
        tint: "text-accent bg-accent-soft",
        to: "/recruiter/applications" as const,
      },
    ],
    [stats, profileStatus],
  );

  const recentApplications = asList<DashboardApplication>(dashboard?.recent_applications);
  const recentPosts = asList<RecruiterOpportunity>(
    dashboard?.recent_opportunities ?? dashboard?.recent_posts,
  );
  const recentEarnings = asList<DashboardEarning>(dashboard?.recent_earnings);
  const recentUnlocks = asList<DashboardEarning>(dashboard?.recent_candidate_unlocks);
  const upcomingInterviews = asList<DashboardApplication>(dashboard?.upcoming_interviews);
  const notifications = asList<DashboardNotification>(dashboard?.notifications);
  const recentActivity = asList<DashboardActivity>(dashboard?.recent_activity);
  const performance = asList<RecruiterOpportunity>(dashboard?.opportunity_performance);
  const trends = asList<TrendPoint>(dashboard?.application_trends?.chart);
  const maxTrend = Math.max(...trends.map((t) => Number(t.applications ?? 0)), 1);
  const user = dashboard?.user;
  const initials = getInitials(user?.name ?? "Recruiter");
  const mostViewed = dashboard?.most_viewed_opportunity;

  return (
    <RecruiterLayout
      title="Dashboard"
      subtitle="Your recruiter command center"
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
                {user?.profile_photo || profileStatus?.company_logo ? (
                  <img
                    src={user?.profile_photo || profileStatus?.company_logo || ""}
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
                      {profileStatus?.company_name ||
                        user?.company ||
                        user?.current_role ||
                        "Recruiter workspace"}
                    </span>
                    {profileStatus?.approval_status && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft px-2 py-0.5 text-xs font-medium text-secondary">
                        <CheckCircle2 className="h-3 w-3" />
                        {titleCase(String(profileStatus.approval_status))}
                      </span>
                    )}
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
                <Link key={card.label} to={card.to} className={`${cardBase} p-5 transition-shadow hover:shadow-card-hover`}>
                  <div className="flex items-start justify-between">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${card.tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-tight">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
                </Link>
              );
            })}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={`${cardBase} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Application Trends</h3>
                <span className="text-xs text-muted-foreground">Last 7 days</span>
              </div>
              {trends.length === 0 ? (
                <InlineEmpty title="No trend data yet" />
              ) : (
                <div className="flex h-40 items-end gap-2">
                  {trends.map((point) => {
                    const value = Number(point.applications ?? 0);
                    const height = Math.max(8, Math.round((value / maxTrend) * 100));
                    return (
                      <div key={point.date ?? point.label} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-md bg-primary/80"
                          style={{ height: `${height}%` }}
                          title={`${value} applications`}
                        />
                        <span className="text-[10px] text-muted-foreground">{point.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`${cardBase} p-5`}>
              <h3 className="mb-4 font-semibold">Recruiter Profile Status</h3>
              <div className="space-y-3 text-sm">
                <StatusRow label="Company" value={profileStatus?.company_name || user?.company || "—"} />
                <StatusRow label="Type" value={titleCase(String(profileStatus?.recruiter_type || "—"))} />
                <StatusRow label="Industry" value={profileStatus?.industry || "—"} />
                <StatusRow
                  label="Completion"
                  value={`${formatNumber(profileStatus?.profile_completion ?? stats?.profile_completion)}%`}
                />
                <StatusRow label="Approval" value={titleCase(String(profileStatus?.approval_status || "—"))} />
              </div>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link to="/recruiter/profile">Edit profile</Link>
              </Button>
            </div>

            <div className={`${cardBase} p-5`}>
              <h3 className="mb-4 font-semibold">Most Viewed Opportunity</h3>
              {!mostViewed ? (
                <InlineEmpty title="No viewed opportunities yet" />
              ) : (
                <div>
                  <p className="font-semibold">{mostViewed.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{mostViewed.company_name}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Views</p>
                      <p className="font-semibold">{formatNumber(mostViewed.views)}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Applications</p>
                      <p className="font-semibold">{formatNumber(mostViewed.applications_count)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={`${cardBase} lg:col-span-2`}>
              <SectionHeader title="Recent Applications" link="/recruiter/applications" linkLabel="View all" />
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
                          {application.opportunity?.title ?? "Opportunity"} ·{" "}
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {dashboard?.unread_notifications ?? 0} unread
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/recruiter/notifications">
                      <BellDot className="h-4 w-4" />
                    </Link>
                  </Button>
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
              <SectionHeader title="Recent Opportunities" link="/recruiter/manage-posts" linkLabel="Manage" />
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
                          {post.company_name || "Company"} · {formatNumber(post.applications_count)} apps ·{" "}
                          {formatNumber(post.views)} views
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

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={cardBase}>
              <div className="border-b border-border px-5 py-4">
                <h3 className="font-semibold">Upcoming Interviews</h3>
              </div>
              {upcomingInterviews.length === 0 ? (
                <InlineEmpty title="No upcoming interviews" />
              ) : (
                <ul className="divide-y divide-border">
                  {upcomingInterviews.map((item) => (
                    <li key={item.id} className="px-5 py-3">
                      <p className="text-sm font-semibold">{item.candidate?.name ?? "Candidate"}</p>
                      <p className="text-xs text-muted-foreground">{item.opportunity?.title}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDateTime(item.interview_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={cardBase}>
              <div className="border-b border-border px-5 py-4">
                <h3 className="font-semibold">Opportunity Performance</h3>
              </div>
              {performance.length === 0 ? (
                <InlineEmpty title="No performance data" />
              ) : (
                <ul className="divide-y divide-border">
                  {performance.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(item.applications_count)} apps · {formatNumber(item.views)} views
                        </p>
                      </div>
                      <PostStatusPill status={item.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={cardBase}>
              <div className="border-b border-border px-5 py-4">
                <h3 className="font-semibold">Recent Candidate Unlocks</h3>
              </div>
              {recentUnlocks.length === 0 ? (
                <InlineEmpty title="No unlocks yet" />
              ) : (
                <ul className="divide-y divide-border">
                  {recentUnlocks.map((item) => (
                    <li key={item.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {item.candidate?.name ?? "Candidate"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.opportunity?.title ?? "Opportunity"}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={`${cardBase} lg:col-span-2`}>
              <div className="border-b border-border px-5 py-4">
                <h3 className="font-semibold">Recent Activity</h3>
              </div>
              {recentActivity.length === 0 ? (
                <InlineEmpty title="No recent activity" />
              ) : (
                <ul className="divide-y divide-border">
                  {recentActivity.map((item, index) => (
                    <li key={`${item.type}-${item.created_at}-${index}`} className="px-5 py-3">
                      <p className="text-sm font-semibold">{item.title ?? "Activity"}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDate(item.created_at)}
                        {item.amount != null ? ` · ${formatCurrency(item.amount)}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
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
  link: "/recruiter/applications" | "/recruiter/manage-posts" | "/recruiter/notifications";
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

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
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

function formatDateTime(value?: string | null) {
  if (!value) return "Schedule unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule unavailable";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
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
