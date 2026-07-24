import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Bell,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GitBranch,
  LineChart,
  Mail,
  Plus,
  Send,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HrLayout } from "@/components/hr/HrLayout";
import {
  HrEmptyState,
  HrErrorState,
  HrLoadingSkeleton,
  apiErrorMessage,
} from "@/components/hr/shared";
import { Button } from "@/components/ui/button";
import {
  hrService,
  stageLabel,
  type HRCandidateBrief,
  type HRInterview,
  type HRJob,
  type HRProfile,
} from "@/services/hrService";
import { cn } from "@/lib/utils";

type DashboardStats = {
  active_jobs: number;
  open_jobs: number;
  closed_jobs: number;
  total_applications: number;
  today_applications: number;
  today_interviews: number;
  week_interviews: number;
  offers_sent: number;
  hired: number;
  rejected: number;
  avg_hiring_time_days: number;
  pending_reviews: number;
};

type DashboardApplication = {
  id: number;
  current_stage: string;
  rating?: number | null;
  joined_date?: string | null;
  created_at?: string | null;
  candidate?: Pick<HRCandidateBrief, "id" | "name" | "email" | "profile_photo"> | null;
  job?: Pick<HRJob, "id" | "title" | "department"> | null;
};

type DashboardActivity = {
  id: number;
  action: string;
  module?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type DashboardNotification = {
  id: number;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  is_read?: boolean;
  created_at?: string | null;
};

type DashboardQuickActionPath =
  | "/hr/jobs/create"
  | "/hr/pipeline"
  | "/hr/applications"
  | "/hr/interviews"
  | "/hr/reports"
  | "/hr/notifications";

type DashboardQuickAction = {
  label: string;
  path: DashboardQuickActionPath;
};

type DashboardData = {
  profile:
    | (Pick<
        HRProfile,
        "company_name" | "designation" | "department" | "verified" | "office_location"
      > & {
        company_logo?: string | null;
      })
    | null;
  user: {
    id: number;
    name: string;
    email: string;
    profile_photo?: string | null;
  };
  stats: DashboardStats;
  pipeline_counts?: Record<string, number>;
  funnel?: Record<string, number>;
  today_interviews?: HRInterview[];
  upcoming_interviews?: HRInterview[];
  recent_applications?: DashboardApplication[];
  recent_hires?: DashboardApplication[];
  recent_jobs?: HRJob[];
  recent_activity?: DashboardActivity[];
  notifications?: DashboardNotification[];
  unread_notifications?: number;
  monthly_hires?: { month: string; hires: number; applications: number }[];
  quick_actions?: DashboardQuickAction[];
};

const statCardMeta = [
  {
    key: "active_jobs",
    label: "Active jobs",
    icon: Briefcase,
    tint: "text-primary bg-primary-soft",
  },
  {
    key: "open_jobs",
    label: "Open jobs",
    icon: GitBranch,
    tint: "text-secondary bg-secondary-soft",
  },
  {
    key: "closed_jobs",
    label: "Closed jobs",
    icon: CheckCircle2,
    tint: "text-muted-foreground bg-muted",
  },
  {
    key: "total_applications",
    label: "Applications",
    icon: Users,
    tint: "text-primary bg-primary-soft",
  },
  {
    key: "today_applications",
    label: "Applied today",
    icon: FileText,
    tint: "text-accent bg-accent-soft",
  },
  {
    key: "today_interviews",
    label: "Today's interviews",
    icon: CalendarClock,
    tint: "text-primary bg-primary-soft",
  },
  {
    key: "week_interviews",
    label: "Interviews this week",
    icon: Clock3,
    tint: "text-secondary bg-secondary-soft",
  },
  { key: "offers_sent", label: "Offers sent", icon: Send, tint: "text-primary bg-primary-soft" },
  { key: "hired", label: "Hired", icon: UserCheck, tint: "text-secondary bg-secondary-soft" },
  { key: "rejected", label: "Rejected", icon: UserX, tint: "text-destructive bg-destructive/10" },
  {
    key: "avg_hiring_time_days",
    label: "Avg. hiring days",
    icon: TrendingUp,
    tint: "text-accent bg-accent-soft",
  },
  {
    key: "pending_reviews",
    label: "Pending reviews",
    icon: ClipboardCheck,
    tint: "text-primary bg-primary-soft",
  },
] satisfies {
  key: keyof DashboardStats;
  label: string;
  icon: typeof Briefcase;
  tint: string;
}[];

const numberFormatter = new Intl.NumberFormat();

function formatMetric(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function formatTime(value?: string | null) {
  if (!value) return "Time pending";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time pending"
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function sectionTitle(action: string) {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function HrDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.dashboard();
      setData(res.data as DashboardData);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Failed to load HR dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const pipelineEntries = useMemo(() => {
    const counts = data?.pipeline_counts ?? data?.funnel ?? {};
    return Object.entries(counts).map(([stage, count]) => ({
      stage: stageLabel(stage),
      count,
    }));
  }, [data]);

  const monthlyHires = data?.monthly_hires ?? [];
  const recentApplications = data?.recent_applications ?? [];
  const upcomingInterviews = data?.upcoming_interviews ?? data?.today_interviews ?? [];
  const recentHires = data?.recent_hires ?? [];
  const recentJobs = data?.recent_jobs ?? [];
  const recentActivity = data?.recent_activity ?? [];
  const notifications = data?.notifications ?? [];
  const quickActions = data?.quick_actions ?? [];
  const hasPipelineData = pipelineEntries.some((entry) => entry.count > 0);
  const hasMonthlyData = monthlyHires.some((entry) => entry.hires > 0 || entry.applications > 0);

  return (
    <HrLayout
      title="Dashboard"
      subtitle="Hiring overview and today's priorities"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/hr/jobs/create">
            <Plus className="h-4 w-4" /> Create Job
          </Link>
        </Button>
      }
    >
      {loading && <HrLoadingSkeleton rows={8} />}

      {!loading && error && <HrErrorState message={error} onRetry={loadDashboard} />}

      {!loading && !error && data && (
        <>
          <section className="relative overflow-hidden rounded-2xl border border-border gradient-hero p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-primary/15 text-xl font-bold text-primary">
                  {data.user.profile_photo ? (
                    <img
                      src={data.user.profile_photo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    data.user.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Welcome back</p>
                  <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {data.user.name}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {data.profile?.company_name ?? "Your company"}
                    </span>
                    {data.profile?.designation && <span>{data.profile.designation}</span>}
                    {data.profile?.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft px-2 py-0.5 text-xs font-medium text-secondary">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/hr/pipeline">Open pipeline</Link>
                </Button>
                <Button asChild variant="brand" size="sm">
                  <Link to="/hr/applications">Review applications</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCardMeta.map((stat) => {
              const Icon = stat.icon;
              const value = data.stats[stat.key] ?? 0;
              return (
                <div
                  key={stat.key}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="mt-2 font-display text-3xl font-bold tracking-tight">
                        {formatMetric(value)}
                      </p>
                    </div>
                    <span className={cn("grid h-10 w-10 place-items-center rounded-xl", stat.tint)}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card xl:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">Hiring funnel</h3>
                  <p className="text-sm text-muted-foreground">Candidates by pipeline stage</p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/hr/reports">
                    Reports <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="h-72">
                {hasPipelineData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineEntries}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <HrEmptyState
                      title="No pipeline data yet"
                      description="Applications will appear here as candidates move through stages."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">Quick actions</h3>
                  <p className="text-sm text-muted-foreground">Shortcuts from your HR workspace</p>
                </div>
                <LineChart className="h-5 w-5 text-primary" />
              </div>
              {quickActions.length > 0 ? (
                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <Link
                      key={`${action.path}-${action.label}`}
                      to={action.path}
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-3 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <HrEmptyState title="No quick actions available" />
              )}
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">Monthly hiring</h3>
                  <p className="text-sm text-muted-foreground">Applications and hires by month</p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/hr/reports">Details</Link>
                </Button>
              </div>
              <div className="h-72">
                {hasMonthlyData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyHires}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="applications"
                        fill="hsl(var(--primary))"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar dataKey="hires" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <HrEmptyState
                      title="No monthly hiring data"
                      description="Hiring trends will populate as activity is recorded."
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">Upcoming interviews</h3>
                  <p className="text-sm text-muted-foreground">Scheduled conversations</p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/hr/interviews">View all</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {upcomingInterviews.length === 0 && (
                  <HrEmptyState
                    title="No interviews scheduled"
                    description="Upcoming interviews will appear here."
                  />
                )}
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {interview.candidate?.name ?? "Candidate"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {interview.job?.title ?? "Job"} · {formatDateTime(interview.scheduled_at)}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                        {formatTime(interview.scheduled_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card xl:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">Recent applications</h3>
                  <p className="text-sm text-muted-foreground">
                    Latest candidates entering the funnel
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/hr/applications">View all</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {recentApplications.length === 0 && (
                  <HrEmptyState
                    title="No applications yet"
                    description="New applications will show up here as candidates apply."
                  />
                )}
                {recentApplications.map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {application.candidate?.name ?? "Candidate"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {application.job?.title ?? "Job"} · {stageLabel(application.current_stage)}
                      </p>
                    </div>
                    {application.candidate?.id && (
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to="/hr/candidates/$id"
                          params={{ id: String(application.candidate.id) }}
                        >
                          Profile
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">Recent hires</h3>
                  <p className="text-sm text-muted-foreground">Candidates marked as joined</p>
                </div>
                <UserCheck className="h-5 w-5 text-secondary" />
              </div>
              <div className="space-y-3">
                {recentHires.length === 0 && (
                  <HrEmptyState
                    title="No hires yet"
                    description="Joined candidates will appear here."
                  />
                )}
                {recentHires.map((hire) => (
                  <div key={hire.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {hire.candidate?.name ?? "Candidate"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {hire.job?.title ?? "Job"} · Joined {formatDate(hire.joined_date)}
                        </p>
                      </div>
                      {hire.candidate?.id && (
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/hr/candidates/$id" params={{ id: String(hire.candidate.id) }}>
                            View
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">Recent jobs</h3>
                  <p className="text-sm text-muted-foreground">Newest openings in your workspace</p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/hr/jobs/create">Create</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {recentJobs.length === 0 && (
                  <HrEmptyState
                    title="No jobs yet"
                    description="Create an opening to start collecting applications."
                    action={
                      <Button asChild variant="brand" size="sm">
                        <Link to="/hr/jobs/create">Create job</Link>
                      </Button>
                    }
                  />
                )}
                {recentJobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{job.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {job.department ?? "General"} · {job.applications_count ?? 0} applications
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {sectionTitle(job.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="font-display text-lg font-semibold">Recent activity</h3>
                  <p className="text-sm text-muted-foreground">Audit trail for HR actions</p>
                </div>
              </div>
              <div className="space-y-3">
                {recentActivity.length === 0 && (
                  <HrEmptyState
                    title="No recent activity"
                    description="Job and candidate updates will be logged here."
                  />
                )}
                {recentActivity.map((log) => (
                  <div key={log.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium">
                      {log.description ?? sectionTitle(log.action)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.module ?? "HR"} · {formatDateTime(log.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {data.unread_notifications ?? 0} unread updates
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/hr/notifications">
                    View <Bell className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {notifications.length === 0 && (
                  <HrEmptyState
                    title="No notifications"
                    description="Important hiring updates will appear here."
                  />
                )}
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "rounded-xl border border-border p-3",
                      !notification.is_read && "bg-primary-soft/40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {notification.title ?? "Notification"}
                        </p>
                        {notification.message && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </HrLayout>
  );
}
