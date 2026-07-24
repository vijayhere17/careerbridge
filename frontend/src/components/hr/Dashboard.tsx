import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  Users,
  ClipboardCheck,
  CalendarClock,
  Plus,
  ArrowRight,
  CheckCircle2,
  Activity,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HrLayout } from "@/components/hr/HrLayout";
import { Button } from "@/components/ui/button";
import { hrService, stageLabel } from "@/services/hrService";
import { cn } from "@/lib/utils";

type DashboardData = {
  profile: {
    company_name?: string;
    designation?: string;
    verified?: boolean;
    company_logo?: string | null;
  } | null;
  user: { name: string; email: string; profile_photo?: string | null };
  stats: {
    open_jobs: number;
    total_applications: number;
    pending_reviews: number;
    offers_pending: number;
    joined: number;
    today_interviews: number;
  };
  funnel: Record<string, number>;
  today_interviews: any[];
  recent_applications: any[];
  recent_activity: any[];
  monthly_hires: { month: string; hires: number; applications: number }[];
};

export function HrDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    hrService
      .dashboard()
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.message ?? "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Open Jobs",
      value: data?.stats.open_jobs ?? 0,
      icon: Briefcase,
      tint: "text-primary bg-primary-soft",
    },
    {
      label: "Applications",
      value: data?.stats.total_applications ?? 0,
      icon: Users,
      tint: "text-secondary bg-secondary-soft",
    },
    {
      label: "Pending Reviews",
      value: data?.stats.pending_reviews ?? 0,
      icon: ClipboardCheck,
      tint: "text-accent bg-accent-soft",
    },
    {
      label: "Today's Interviews",
      value: data?.stats.today_interviews ?? 0,
      icon: CalendarClock,
      tint: "text-primary bg-primary-soft",
    },
  ];

  const funnelEntries = Object.entries(data?.funnel ?? {}).map(([stage, count]) => ({
    stage: stageLabel(stage),
    count,
  }));

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
      {loading && (
        <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
          Loading dashboard…
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <section className="relative overflow-hidden rounded-2xl border border-border gradient-hero p-6 sm:p-8 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary font-display text-xl font-bold">
                  {data.user.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Welcome back</p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                    {data.user.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {data.profile?.company_name ?? "Your company"}
                    </span>
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

          <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="mt-2 font-display text-3xl font-bold tracking-tight">
                        {s.value}
                      </p>
                    </div>
                    <span className={cn("grid h-10 w-10 place-items-center rounded-xl", s.tint)}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-semibold">Hiring funnel</h3>
                  <p className="text-sm text-muted-foreground">Candidates by pipeline stage</p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/hr/reports">
                    Details <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelEntries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg font-semibold">Quick actions</h3>
              <div className="mt-4 space-y-2">
                {[
                  { label: "Create job opening", to: "/hr/jobs/create" },
                  { label: "View hiring pipeline", to: "/hr/pipeline" },
                  { label: "Schedule interview", to: "/hr/interviews" },
                  { label: "Open analytics", to: "/hr/reports" },
                ].map((a) => (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-3 text-sm hover:bg-muted/50 transition-colors"
                  >
                    <span>{a.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Recent applications</h3>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/hr/applications">View all</Link>
                </Button>
              </div>
              <div className="space-y-3">
                {data.recent_applications.length === 0 && (
                  <p className="text-sm text-muted-foreground">No applications yet.</p>
                )}
                {data.recent_applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{app.candidate?.name ?? "Candidate"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.job?.title} · {stageLabel(app.current_stage)}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/hr/candidates/${app.candidate?.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg font-semibold mb-4">Today's interviews</h3>
              <div className="space-y-3">
                {data.today_interviews.length === 0 && (
                  <p className="text-sm text-muted-foreground">No interviews scheduled today.</p>
                )}
                {data.today_interviews.map((iv) => (
                  <div key={iv.id} className="rounded-xl border border-border p-3">
                    <p className="font-medium">{iv.candidate?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {iv.job?.title} · {new Date(iv.scheduled_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg font-semibold mb-4">Monthly hiring</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthly_hires}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="hires" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-display text-lg font-semibold">Recent activity</h3>
              </div>
              <div className="space-y-3">
                {data.recent_activity.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                )}
                {data.recent_activity.map((log) => (
                  <div key={log.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium">{log.description ?? log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.module} · {new Date(log.created_at).toLocaleString()}
                    </p>
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
