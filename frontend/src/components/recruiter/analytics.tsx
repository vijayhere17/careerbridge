import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  Coins,
  Eye,
  LineChart as LineChartIcon,
  Percent,
  TrendingUp,
  UnlockKeyhole,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import {
  RecruiterEmptyState,
  RecruiterErrorState,
  RecruiterLoadingSkeleton,
  apiErrorMessage,
} from "@/components/recruiter/shared";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recruiterService } from "@/services/recruiterOpportunityService";

type DaysRange = "7" | "30" | "90";

type AnalyticsStats = {
  total_views?: number | string | null;
  total_applications?: number | string | null;
  contact_unlock_count?: number | string | null;
  earnings?: number | string | null;
  hiring_rate?: number | string | null;
  conversion_rate?: number | string | null;
};

type DailyPoint = {
  date?: string;
  label?: string;
  applications?: number | string | null;
  views?: number | string | null;
  earnings?: number | string | null;
};

type MonthlyPoint = {
  month?: string;
  label?: string;
  applications?: number | string | null;
};

type OpportunityPerformance = {
  id: number;
  title?: string | null;
  company_name?: string | null;
  status?: string | null;
  views?: number | string | null;
  applications_count?: number | string | null;
  unlocks_count?: number | string | null;
};

type SkillPoint = {
  skill?: string | null;
  count?: number | string | null;
};

type AnalyticsPayload = {
  range_days?: number;
  stats?: AnalyticsStats;
  daily_chart?: DailyPoint[];
  monthly_applications?: MonthlyPoint[];
  earnings_trend?: DailyPoint[];
  hiring_funnel?:
    | Record<string, number | string | null>
    | Array<{ label?: string; count?: number }>;
  opportunity_performance?: OpportunityPerformance[];
  top_skills?: SkillPoint[];
};

type ChartDataPoint = Record<string, string | number>;

export function AnalyticsPage() {
  const [days, setDays] = useState<DaysRange>("30");
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await recruiterService.analytics({ days });
      setData((res.data ?? {}) as AnalyticsPayload);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load analytics");
      setError(message);
      setData(null);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const stats = data?.stats ?? {};
  const dailyChart = useMemo(
    () =>
      (data?.daily_chart ?? []).map((point) => ({
        label: point.label ?? point.date ?? "—",
        applications: numeric(point.applications),
        views: numeric(point.views),
      })),
    [data],
  );
  const monthlyApplications = useMemo(
    () =>
      (data?.monthly_applications ?? []).map((point) => ({
        label: point.label ?? point.month ?? "—",
        applications: numeric(point.applications),
      })),
    [data],
  );
  const earningsTrend = useMemo(
    () =>
      (data?.earnings_trend ?? []).map((point) => ({
        label: point.label ?? point.date ?? "—",
        earnings: numeric(point.earnings),
      })),
    [data],
  );
  const funnelData = useMemo(() => normalizeFunnel(data?.hiring_funnel), [data]);
  const topOpportunities = data?.opportunity_performance ?? [];
  const topSkills = data?.top_skills ?? [];

  const cards = [
    {
      label: "Total Views",
      value: formatNumber(stats.total_views),
      icon: Eye,
      tint: "bg-primary-soft text-primary",
    },
    {
      label: "Applications",
      value: formatNumber(stats.total_applications),
      icon: Users,
      tint: "bg-accent-soft text-accent-foreground",
    },
    {
      label: "Unlocks",
      value: formatNumber(stats.contact_unlock_count),
      icon: UnlockKeyhole,
      tint: "bg-secondary-soft text-secondary",
    },
    {
      label: "Earnings",
      value: money(stats.earnings),
      icon: Coins,
      tint: "bg-primary-soft text-primary",
    },
    {
      label: "Hiring Rate",
      value: percent(stats.hiring_rate),
      icon: TrendingUp,
      tint: "bg-secondary-soft text-secondary",
    },
    {
      label: "Conversion Rate",
      value: percent(stats.conversion_rate),
      icon: Percent,
      tint: "bg-accent-soft text-accent-foreground",
    },
  ];

  const hasAnyData =
    cards.some((card) => card.value !== "0" && card.value !== "₹0" && card.value !== "0%") ||
    hasPositiveValue(dailyChart) ||
    hasPositiveValue(monthlyApplications) ||
    hasPositiveValue(earningsTrend) ||
    hasPositiveValue(funnelData) ||
    topOpportunities.length > 0 ||
    topSkills.length > 0;

  return (
    <RecruiterLayout
      title="Analytics"
      subtitle={`Performance insights for the last ${days} days`}
      actions={
        <Select value={days} onValueChange={(value) => setDays(value as DaysRange)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {loading ? (
        <RecruiterLoadingSkeleton rows={6} />
      ) : error ? (
        <RecruiterErrorState message={error} onRetry={loadAnalytics} />
      ) : !data || !hasAnyData ? (
        <RecruiterEmptyState
          title="No analytics yet"
          description="Views, applications, unlocks, and earnings will appear after your opportunities receive activity."
        />
      ) : (
        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${card.tint}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{card.label}</p>
                  <p className="font-display text-2xl font-bold">{card.value}</p>
                </div>
              );
            })}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard
              title="Daily applications and views"
              description="Applications and opportunity views by day"
              empty={!hasPositiveValue(dailyChart)}
              emptyTitle="No daily activity yet"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Monthly applications"
              description="Application volume over the last six months"
              empty={!hasPositiveValue(monthlyApplications)}
              emptyTitle="No monthly applications yet"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyApplications}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Earnings trend"
              description="Earned contact unlock revenue"
              empty={!hasPositiveValue(earningsTrend)}
              emptyTitle="No earnings yet"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => money(Number(value))} />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Hiring funnel"
              description="Applications by workflow stage"
              empty={!hasPositiveValue(funnelData)}
              emptyTitle="No funnel data yet"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Top opportunities</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Posts ranked by applications and views
              </p>
              {topOpportunities.length === 0 ? (
                <div className="mt-4">
                  <RecruiterEmptyState
                    title="No opportunity performance yet"
                    description="Published opportunities with activity will appear here."
                  />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {topOpportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className="rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {opportunity.title || "Opportunity"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {opportunity.company_name || "Company"}
                          </p>
                        </div>
                        {opportunity.status && (
                          <Badge variant="secondary">{titleCase(opportunity.status)}</Badge>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                        <Metric label="Views" value={formatNumber(opportunity.views)} />
                        <Metric
                          label="Applications"
                          value={formatNumber(opportunity.applications_count)}
                        />
                        <Metric label="Unlocks" value={formatNumber(opportunity.unlocks_count)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2">
                <LineChartIcon className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Top skills</h3>
              </div>
              <p className="text-sm text-muted-foreground">Skills seen most often in applicants</p>
              {topSkills.length === 0 ? (
                <div className="mt-4">
                  <RecruiterEmptyState
                    title="No skill data yet"
                    description="Applicant skills will populate this list."
                  />
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {topSkills.map((skill) => (
                    <Badge key={skill.skill} variant="secondary" className="rounded-full px-3 py-1">
                      {titleCase(skill.skill)} · {formatNumber(skill.count)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </RecruiterLayout>
  );
}

function ChartCard({
  title,
  description,
  empty,
  emptyTitle,
  children,
}: {
  title: string;
  description: string;
  empty: boolean;
  emptyTitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-6 h-72">
        {empty ? (
          <RecruiterEmptyState title={emptyTitle} description="Check back after more activity." />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function normalizeFunnel(input: AnalyticsPayload["hiring_funnel"]): ChartDataPoint[] {
  if (Array.isArray(input)) {
    return input.map((item) => ({
      label: item.label ?? "Stage",
      count: numeric(item.count),
    }));
  }

  return Object.entries(input ?? {}).map(([key, value]) => ({
    label: titleCase(key),
    count: numeric(value),
  }));
}

function hasPositiveValue(points: ChartDataPoint[]) {
  return points.some((point) =>
    Object.values(point).some((value) => typeof value === "number" && value > 0),
  );
}

function numeric(value?: number | string | null) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value?: number | string | null) {
  return new Intl.NumberFormat("en-IN").format(numeric(value));
}

function money(value?: number | string | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(numeric(value));
}

function percent(value?: number | string | null) {
  return `${numeric(value).toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
}

function titleCase(value?: string | null) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const Analytics = AnalyticsPage;
