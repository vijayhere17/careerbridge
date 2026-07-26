import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

type WalletSummary = {
  available_balance?: number;
  pending_balance?: number;
  pending_withdrawals?: number;
  lifetime_earnings?: number;
  monthly_earnings?: number;
  today_earnings?: number;
  booking_earnings?: number;
  referral_earnings?: number;
  total_withdrawn?: number;
};

type WalletTransaction = {
  id: number;
  type?: "credit" | "debit" | string;
  category?: string | null;
  title?: string | null;
  subtitle?: string | null;
  amount?: number | string | null;
  status?: string | null;
  reference?: string | null;
  created_at?: string | null;
};

type PageMeta = {
  currentPage: number;
  lastPage: number;
  total: number;
};

const PER_PAGE = 10;

function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function readableDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

export function MentorWallet() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ currentPage: 1, lastPage: 1, total: 0 });
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [error, setError] = useState("");
  const [txError, setTxError] = useState("");

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<{ balance: number; summary: WalletSummary }>("/api/mentor/wallet");
      setBalance(res.balance ?? 0);
      setSummary(res.summary ?? null);
    } catch (err) {
      console.error(err);
      setError("Failed to load wallet summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoadingTx(true);
    setTxError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(PER_PAGE),
      });
      if (category !== "all") params.set("category", category);
      if (type !== "all") params.set("type", type);

      const res = await apiFetch<{
        transactions: {
          data?: WalletTransaction[];
          current_page?: number;
          last_page?: number;
          total?: number;
        };
      }>(`/api/mentor/wallet/transactions?${params.toString()}`);

      const pageData = res.transactions;
      setTransactions(pageData?.data ?? []);
      setMeta({
        currentPage: pageData?.current_page ?? 1,
        lastPage: pageData?.last_page ?? 1,
        total: pageData?.total ?? 0,
      });
    } catch (err) {
      console.error(err);
      setTransactions([]);
      setTxError("Failed to load transactions.");
    } finally {
      setLoadingTx(false);
    }
  }, [category, page, type]);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  const cards = [
    { label: "Available Balance", value: money(summary?.available_balance ?? balance), icon: Wallet },
    { label: "Pending Balance", value: money(summary?.pending_balance), icon: Clock },
    { label: "Lifetime Earnings", value: money(summary?.lifetime_earnings), icon: TrendingUp },
    { label: "Monthly Earnings", value: money(summary?.monthly_earnings), icon: TrendingUp },
    { label: "Today's Earnings", value: money(summary?.today_earnings), icon: TrendingUp },
    { label: "Booking Earnings", value: money(summary?.booking_earnings), icon: TrendingUp },
    { label: "Total Withdrawn", value: money(summary?.total_withdrawn), icon: TrendingDown },
    { label: "Referral Earnings", value: money(summary?.referral_earnings ?? 0), icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-sm text-muted-foreground">
          Track available balance, earnings, and transaction history.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button className="ml-3 underline" onClick={() => void loadWallet()}>Retry</button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Recent Transactions</h2>
            <p className="text-sm text-muted-foreground">{meta.total} total records</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={category}
              onChange={(e) => { setPage(1); setCategory(e.target.value); }}
              className="dash-input"
            >
              <option value="all">All categories</option>
              <option value="session">Session</option>
              <option value="booking">Booking</option>
              <option value="withdraw">Withdrawal</option>
              <option value="refund">Refund</option>
              <option value="bonus">Bonus</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <select
              value={type}
              onChange={(e) => { setPage(1); setType(e.target.value); }}
              className="dash-input"
            >
              <option value="all">All types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
        </div>

        {loadingTx ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : txError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {txError}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No wallet transactions yet.
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{tx.title || titleCase(tx.category)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {readableDate(tx.created_at)} · {titleCase(tx.category)} · {titleCase(tx.status)}
                  </p>
                </div>
                <p className={`shrink-0 text-sm font-bold ${tx.type === "debit" ? "text-red-600" : "text-green-600"}`}>
                  {tx.type === "debit" ? "-" : "+"}
                  {money(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}

        {meta.lastPage > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {meta.currentPage} of {meta.lastPage}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                disabled={page >= meta.lastPage}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
