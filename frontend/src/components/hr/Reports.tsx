import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HrLayout } from "@/components/hr/HrLayout";
import { hrService } from "@/services/hrService";

const PIE_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#64748B", "#EC4899"];

export function HrReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    hrService
      .reports()
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.message ?? "Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  const summaryCards = data
    ? [
        { label: "Total Jobs", value: data.summary.total_jobs },
        { label: "Open Jobs", value: data.summary.open_jobs },
        { label: "Applications", value: data.summary.total_applications },
        { label: "Hired", value: data.summary.hired },
        { label: "Avg Time to Hire", value: `${data.summary.avg_time_to_hire_days}d` },
        { label: "Hire Rate", value: `${data.conversion_rates.overall_hire_rate}%` },
      ]
    : [];

  return (
    <HrLayout title="Reports" subtitle="Hiring analytics and conversion insights">
      {loading && <p className="text-sm text-muted-foreground">Loading reports…</p>}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {data && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {summaryCards.map((c) => (
              <div key={c.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{c.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg font-semibold">Hiring funnel</h3>
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.funnel}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg font-semibold">Conversion rates</h3>
              <div className="mt-4 space-y-3">
                {Object.entries(data.conversion_rates).map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-border p-3 flex items-center justify-between">
                    <span className="text-sm capitalize">{key.replaceAll("_", " ")}</span>
                    <span className="font-semibold">{String(value)}%</span>
                  </div>
                ))}
              </div>
              <div className="h-48 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.funnel.filter((f: any) => f.count > 0)}
                      dataKey="count"
                      nameKey="label"
                      outerRadius={80}
                    >
                      {data.funnel.map((_: any, i: number) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg font-semibold">Monthly reports</h3>
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthly_reports}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="applications" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="hired" fill="#10B981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="interviews" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg font-semibold">Department analytics</h3>
              <div className="mt-4 space-y-2">
                {(data.department_analytics ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No department data yet.</p>
                )}
                {(data.department_analytics ?? []).map((d: any) => (
                  <div key={d.department} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{d.department}</p>
                      <p className="text-sm text-muted-foreground">{d.jobs} jobs</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.applications} apps · {d.hired} hired · {d.rejected} rejected
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-semibold">Top jobs</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 font-medium">Title</th>
                    <th className="px-3 py-2 font-medium">Department</th>
                    <th className="px-3 py-2 font-medium">Applications</th>
                    <th className="px-3 py-2 font-medium">Hired</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.top_jobs ?? []).map((job: any) => (
                    <tr key={job.id} className="border-t border-border">
                      <td className="px-3 py-2 font-medium">{job.title}</td>
                      <td className="px-3 py-2 text-muted-foreground">{job.department ?? "—"}</td>
                      <td className="px-3 py-2">{job.applications_count}</td>
                      <td className="px-3 py-2">{job.hired}</td>
                      <td className="px-3 py-2 capitalize">{job.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </HrLayout>
  );
}
