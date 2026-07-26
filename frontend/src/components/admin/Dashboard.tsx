import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Briefcase, CheckCircle2, Clock3, UsersRound, GraduationCap,
  AlertTriangle, Building2, Activity,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingSkeleton,
  apiErrorMessage,
  formatDate,
  typeLabel,
} from "@/components/admin/shared";
import { adminService, type AdminDashboardStats } from "@/services/adminService";

function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  to?: string;
}) {
  const body = (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:border-primary/30">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.dashboard();
      setStats(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load admin dashboard."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <AdminLayout title="Admin Dashboard" subtitle="Recruiter approvals and platform overview">
      {loading && <AdminLoadingSkeleton rows={6} />}
      {!loading && error && <AdminErrorState message={error} onRetry={load} />}
      {!loading && !error && stats && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Pending Recruiters" value={stats.pending_recruiters} icon={Clock3} to="/admin/recruiters" />
            <StatCard label="Approved Recruiters" value={stats.approved_recruiters} icon={CheckCircle2} to="/admin/recruiters" />
            <StatCard label="Rejected Recruiters" value={stats.rejected_recruiters} icon={AlertTriangle} to="/admin/recruiters" />
            <StatCard label="Pending Reviews" value={stats.pending_reviews} icon={Briefcase} to="/admin/recruiters" />
            <StatCard label="Today's Registrations" value={stats.todays_registrations} icon={UsersRound} />
            <StatCard label="Monthly Registrations" value={stats.monthly_registrations} icon={Building2} />
            <StatCard label="Verification Pending" value={stats.verification_pending} icon={AlertTriangle} />
            <StatCard label="Mentors" value={stats.totals.mentors} icon={GraduationCap} to="/admin/mentors" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-display text-lg font-semibold">Recruiters by type</h2>
              <div className="mt-4 space-y-2">
                {Object.keys(stats.recruiters_by_type).length === 0 ? (
                  <AdminEmptyState title="No type data yet" />
                ) : (
                  Object.entries(stats.recruiters_by_type).map(([type, total]) => (
                    <div key={type} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
                      <span>{typeLabel(type)}</span>
                      <span className="font-semibold">{total}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="font-display text-lg font-semibold">Top industries</h2>
              <div className="mt-4 space-y-2">
                {stats.top_industries.length === 0 ? (
                  <AdminEmptyState title="No industry data yet" />
                ) : (
                  stats.top_industries.map((row) => (
                    <div key={row.industry} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
                      <span>{row.industry}</span>
                      <span className="font-semibold">{row.total}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Recent activity</h2>
            </div>
            {stats.recent_activity.length === 0 ? (
              <AdminEmptyState title="No admin actions yet" description="Approvals and review actions will appear here." />
            ) : (
              <div className="space-y-2">
                {stats.recent_activity.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5 text-sm">
                    <div>
                      <p className="font-medium">
                        {item.action.replaceAll("_", " ")} · {item.company_name || item.recruiter_name || "Recruiter"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.admin?.name ?? "Admin"} · {formatDate(item.created_at)}
                      </p>
                    </div>
                    {item.user_id ? (
                      <Link
                        to="/admin/recruiters/$userId"
                        params={{ userId: String(item.user_id) }}
                        className="text-xs font-semibold text-primary"
                      >
                        View
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
