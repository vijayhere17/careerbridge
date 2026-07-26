import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Coins,
  TrendingUp,
  Users2,
  Wallet,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import {
  RecruiterEmptyState,
  RecruiterErrorState,
  RecruiterLoadingSkeleton,
  apiErrorMessage,
  asList,
} from "@/components/recruiter/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { recruiterService } from "@/services/recruiterOpportunityService";

type UnlockStats = {
  total?: { count?: number; amount?: number };
  today?: { count?: number; amount?: number };
  monthly?: { count?: number; amount?: number };
  by_status?: Record<string, number>;
};

type UnlockItem = {
  id: number;
  amount?: number | string | null;
  status?: string | null;
  unlocked_at?: string | null;
  created_at?: string | null;
  candidate?: {
    name?: string | null;
    email?: string | null;
    mobile?: string | null;
    location?: string | null;
  } | null;
  opportunity?: {
    title?: string | null;
    company_name?: string | null;
  } | null;
};

type ChartPoint = {
  date?: string;
  label?: string;
  count?: number;
  amount?: number;
};

type PageMeta = {
  currentPage: number;
  lastPage: number;
  total: number;
};

type PaginatedPayload<T> = {
  data?: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
};

type ChartPayload = ChartPoint[] | { chart?: ChartPoint[] } | null | undefined;

const PER_PAGE = 10;

function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function readableDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function normalizePage<T>(payload: PaginatedPayload<T> | T[] | null | undefined): {
  items: T[];
  meta: PageMeta;
} {
  const items = asList<T>(payload);
  const page = Array.isArray(payload) ? null : payload;
  return {
    items,
    meta: {
      currentPage: page?.current_page ?? 1,
      lastPage: page?.last_page ?? 1,
      total: page?.total ?? items.length,
    },
  };
}

function normalizeChart(payload: ChartPayload): ChartPoint[] {
  const points = Array.isArray(payload) ? payload : payload?.chart;
  return Array.isArray(points) ? points : [];
}

function statusClass(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "earned":
    case "success":
      return "bg-secondary-soft text-secondary border-transparent";
    case "pending":
      return "bg-accent-soft text-accent-foreground border-transparent";
    case "refunded":
    case "failed":
      return "bg-destructive/10 text-destructive border-transparent";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
}

export function UnlockEarnings() {
  const [stats, setStats] = useState<UnlockStats | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [unlocks, setUnlocks] = useState<UnlockItem[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ currentPage: 1, lastPage: 1, total: 0 });
  const [status, setStatus] = useState("all");
  const [chartDays, setChartDays] = useState("7");
  const [page, setPage] = useState(1);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingUnlocks, setLoadingUnlocks] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [unlocksError, setUnlocksError] = useState("");

  const chartData = useMemo(
    () =>
      chart.map((point) => ({
        label: point.label ?? point.date ?? "—",
        amount: Number(point.amount ?? 0),
        count: Number(point.count ?? 0),
      })),
    [chart],
  );

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setOverviewError("");
    try {
      const [statsRes, chartRes] = await Promise.all([
        recruiterService.unlockStats(),
        recruiterService.unlockChart({ days: Number(chartDays) || 7 }),
      ]);
      setStats(statsRes.data ?? null);
      setChart(normalizeChart(chartRes.data));
    } catch (err) {
      setOverviewError(apiErrorMessage(err, "Failed to load unlock earnings overview"));
    } finally {
      setLoadingOverview(false);
    }
  }, [chartDays]);

  const loadUnlocks = useCallback(async () => {
    setLoadingUnlocks(true);
    setUnlocksError("");
    try {
      const res = await recruiterService.unlocks({
        page,
        per_page: PER_PAGE,
        status: status === "all" ? undefined : status,
      });
      const normalized = normalizePage<UnlockItem>(res.data as PaginatedPayload<UnlockItem>);
      setUnlocks(normalized.items);
      setMeta(normalized.meta);
    } catch (err) {
      setUnlocks([]);
      setUnlocksError(apiErrorMessage(err, "Failed to load contact unlocks"));
    } finally {
      setLoadingUnlocks(false);
    }
  }, [page, status]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadUnlocks();
  }, [loadUnlocks]);

  const cards = [
    {
      label: "Total Unlocks",
      count: stats?.total?.count ?? 0,
      amount: stats?.total?.amount ?? 0,
      icon: Users2,
      tint: "bg-primary-soft text-primary",
    },
    {
      label: "Today",
      count: stats?.today?.count ?? 0,
      amount: stats?.today?.amount ?? 0,
      icon: Coins,
      tint: "bg-accent-soft text-accent-foreground",
    },
    {
      label: "This Month",
      count: stats?.monthly?.count ?? 0,
      amount: stats?.monthly?.amount ?? 0,
      icon: TrendingUp,
      tint: "bg-secondary-soft text-secondary",
    },
    {
      label: "Earned / Pending",
      count: `${stats?.by_status?.earned ?? 0} / ${stats?.by_status?.pending ?? 0}`,
      amount: stats?.total?.amount ?? 0,
      icon: Wallet,
      tint: "bg-primary-soft text-primary",
    },
  ];

  return (
    <RecruiterLayout
      title="Contact Unlock Earnings"
      subtitle="Track earnings from paid contact unlocks"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/recruiter/withdraw">
            <ArrowDownToLine className="h-4 w-4" /> Withdraw
          </Link>
        </Button>
      }
    >
      {loadingOverview ? (
        <RecruiterLoadingSkeleton rows={2} />
      ) : overviewError ? (
        <RecruiterErrorState message={overviewError} onRetry={loadOverview} />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                  <p className="font-display text-2xl font-bold">{card.count}</p>
                  <p className="text-sm font-medium text-secondary">{money(card.amount)}</p>
                </div>
              );
            })}
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Unlock earnings</h3>
                <p className="text-sm text-muted-foreground">
                  Amount and count from the API chart data
                </p>
              </div>
              <Select value={chartDays} onValueChange={setChartDays}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-6 h-72">
              {chartData.length === 0 ? (
                <RecruiterEmptyState
                  title="No chart data yet"
                  description="Earned unlocks will populate this chart."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "amount" ? [money(Number(value)), "Amount"] : [value, "Unlocks"]
                      }
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Unlocks</h3>
              <p className="text-sm text-muted-foreground">
                {meta.total
                  ? `${meta.total} unlock${meta.total === 1 ? "" : "s"}`
                  : "Recent unlock activity"}
              </p>
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="earned">Earned</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {loadingUnlocks ? (
            <RecruiterLoadingSkeleton rows={4} />
          ) : unlocksError ? (
            <RecruiterErrorState message={unlocksError} onRetry={loadUnlocks} />
          ) : unlocks.length === 0 ? (
            <RecruiterEmptyState
              title="No unlocks found"
              description="Candidate contact unlocks will appear here when buyers unlock them."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Opportunity</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unlocks.map((unlock) => (
                      <TableRow key={unlock.id}>
                        <TableCell>
                          <div className="font-medium">{unlock.candidate?.name || "Candidate"}</div>
                          <div className="text-xs text-muted-foreground">
                            {unlock.candidate?.email ||
                              unlock.candidate?.mobile ||
                              unlock.candidate?.location ||
                              "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{unlock.opportunity?.title || "Opportunity"}</div>
                          {unlock.opportunity?.company_name && (
                            <div className="text-xs text-muted-foreground">
                              {unlock.opportunity.company_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {readableDateTime(unlock.unlocked_at ?? unlock.created_at)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {money(unlock.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusClass(unlock.status)}>
                            {titleCase(unlock.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground">
                  Page {meta.currentPage} of {meta.lastPage}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loadingUnlocks}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.lastPage || loadingUnlocks}
                    onClick={() => setPage((current) => Math.min(meta.lastPage, current + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </RecruiterLayout>
  );
}
