import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { HrLayout } from "@/components/hr/HrLayout";
import {
  HrEmptyState,
  HrErrorState,
  HrLoadingSkeleton,
  apiErrorMessage,
} from "@/components/hr/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { hrService } from "@/services/hrService";

type ReportRow = Record<string, string | number | null | undefined>;

type ReportData = {
  summary?: Record<string, string | number | null | undefined>;
  conversion_rates?: Record<string, number | string | null | undefined>;
  department_analytics?: ReportRow[];
  top_departments?: ReportRow[];
  top_jobs?: ReportRow[];
  funnel?: ReportRow[];
  monthly_reports?: ReportRow[];
  sources?: ReportRow[];
  offer_acceptance_ratio?: ReportRow;
  interview_conversion?: ReportRow;
};

const CHART_COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#64748B",
  "#EC4899",
];

export function HrReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.reports();
      setData(res.data ?? null);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load reports");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summaryCards = useMemo(() => {
    if (!data?.summary) return [];
    const summary = data.summary;
    const conversion = data.conversion_rates ?? {};

    return [
      { label: "Total Jobs", value: formatMetric(summary.total_jobs) },
      { label: "Open Jobs", value: formatMetric(summary.open_jobs) },
      { label: "Applications", value: formatMetric(summary.total_applications) },
      { label: "Hired", value: formatMetric(summary.hired) },
      { label: "Rejected", value: formatMetric(summary.rejected) },
      { label: "Offers Pending", value: formatMetric(summary.offers_pending) },
      {
        label: "Avg Time to Hire",
        value: `${formatMetric(summary.avg_time_to_hire_days)}d`,
      },
      {
        label: "Hire Rate",
        value: formatPercent(conversion.overall_hire_rate),
      },
      {
        label: "Offer Acceptance",
        value: formatPercent(conversion.offer_acceptance_ratio),
      },
      {
        label: "Interview Conversion",
        value: formatPercent(conversion.interview_conversion),
      },
    ];
  }, [data]);

  const funnel = data?.funnel ?? [];
  const monthlyReports = data?.monthly_reports ?? [];
  const departments = data?.department_analytics ?? [];
  const sources = data?.sources ?? [];
  const topJobs = data?.top_jobs ?? [];
  const topDepartments = data?.top_departments ?? [];
  const conversionRates = Object.entries(data?.conversion_rates ?? {}).map(([key, value]) => ({
    name: labelize(key),
    value: numberValue(value),
  }));

  const hasAnyReportData =
    summaryCards.length > 0 ||
    funnel.length > 0 ||
    monthlyReports.length > 0 ||
    departments.length > 0 ||
    sources.length > 0 ||
    topJobs.length > 0 ||
    topDepartments.length > 0;

  return (
    <HrLayout title="Reports" subtitle="Hiring analytics and conversion insights">
      {loading ? (
        <HrLoadingSkeleton rows={6} />
      ) : error ? (
        <HrErrorState message={error} onRetry={load} />
      ) : !data || !hasAnyReportData ? (
        <HrEmptyState
          title="No report data yet"
          description="Hiring analytics will appear once jobs, applications, interviews, and offers are recorded."
          action={
            <Button variant="outline" size="sm" onClick={load}>
              Retry
            </Button>
          }
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{card.value}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard title="Hiring funnel" empty={!hasPositiveValue(funnel, "count")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly reports" empty={monthlyReports.length === 0}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyReports}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="hired" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="interviews" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Conversion rates" empty={conversionRates.length === 0}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionRates} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="value" fill="#10B981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Sources" empty={!hasPositiveValue(sources, "count")}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sources.filter((source) => numberValue(source.count) > 0)}
                    dataKey="count"
                    nameKey="source"
                    outerRadius={92}
                    label={(entry) => entry.source}
                  >
                    {sources.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <RatioCard
              title="Offer acceptance"
              value={numberValue(data.offer_acceptance_ratio?.ratio)}
              details={[
                ["Accepted", formatMetric(data.offer_acceptance_ratio?.accepted)],
                ["Declined", formatMetric(data.offer_acceptance_ratio?.declined)],
                ["Decided", formatMetric(data.offer_acceptance_ratio?.total_decided)],
              ]}
            />
            <RatioCard
              title="Interview conversion"
              value={numberValue(data.interview_conversion?.ratio)}
              details={[
                ["Completed", formatMetric(data.interview_conversion?.completed)],
                ["Scheduled total", formatMetric(data.interview_conversion?.scheduled_total)],
              ]}
            />
            <RatioCard
              title="Average time to hire"
              value={Math.min(numberValue(data.summary?.avg_time_to_hire_days), 100)}
              valueLabel={`${formatMetric(data.summary?.avg_time_to_hire_days)} days`}
              details={[
                ["Hired", formatMetric(data.summary?.hired)],
                ["Applications", formatMetric(data.summary?.total_applications)],
              ]}
            />
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard title="Department analytics" empty={departments.length === 0}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={departments}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="applications" stroke="#2563EB" strokeWidth={2} />
                  <Line type="monotone" dataKey="hired" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-semibold">Top departments</h3>
                <Badge variant="outline">{topDepartments.length}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {topDepartments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No department data available.</p>
                ) : (
                  topDepartments.map((department) => (
                    <div
                      key={`${department.rank}-${department.department}`}
                      className="rounded-xl border border-border p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{department.department ?? "Unassigned"}</p>
                        <span className="text-sm text-muted-foreground">
                          {formatMetric(department.applications)} applications
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatMetric(department.jobs)} jobs - {formatMetric(department.hired)}{" "}
                        hired - {formatPercent(department.hire_rate)} hire rate
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DataTable
              title="Top jobs"
              rows={topJobs}
              columns={[
                ["title", "Title"],
                ["department", "Department"],
                ["applications_count", "Applications"],
                ["hired", "Hired"],
                ["hire_rate", "Hire Rate"],
                ["status", "Status"],
              ]}
            />
            <DataTable
              title="Sources"
              rows={sources}
              columns={[
                ["source", "Source"],
                ["count", "Count"],
                ["percentage", "Percentage"],
              ]}
              percentKeys={["percentage"]}
            />
          </section>
        </>
      )}
    </HrLayout>
  );
}

function ChartCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="mt-4 h-72">
        {empty ? (
          <div className="grid h-full place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function RatioCard({
  title,
  value,
  valueLabel,
  details,
}: {
  title: string;
  value: number;
  valueLabel?: string;
  details: [string, string][];
}) {
  const progressValue = Math.max(0, Math.min(value, 100));

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 font-display text-3xl font-bold">{valueLabel ?? `${value}%`}</p>
      <Progress className="mt-4" value={progressValue} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {details.map(([label, detail]) => (
          <div key={label} className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-semibold">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({
  title,
  rows,
  columns,
  percentKeys = [],
}: {
  title: string;
  rows: ReportRow[];
  columns: [string, string][];
  percentKeys?: string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data available.</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                {columns.map(([, label]) => (
                  <th key={label} className="px-3 py-2 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={String(row.id ?? row.title ?? row.source ?? index)}
                  className="border-t border-border"
                >
                  {columns.map(([key]) => (
                    <td key={key} className="px-3 py-2">
                      {percentKeys.includes(key) || key.endsWith("_rate")
                        ? formatPercent(row[key])
                        : formatMetric(row[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function hasPositiveValue(rows: ReportRow[], key: string) {
  return rows.some((row) => numberValue(row[key]) > 0);
}

function numberValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatMetric(value: unknown) {
  if (value === null || value === undefined || value === "") return "0";
  if (typeof value === "number") return new Intl.NumberFormat().format(value);
  return String(value);
}

function formatPercent(value: unknown) {
  return `${numberValue(value)}%`;
}

function labelize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
