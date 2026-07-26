import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
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

type WalletSummary = {
  balance?: number;
  pending_earnings?: number;
  withdrawn?: number;
  today_earnings?: number;
  monthly_earnings?: number;
  contact_unlock_earnings?: number;
  referral_earnings?: number;
  summary?: {
    available_balance?: number;
    lifetime_earnings?: number;
    pending_earnings?: number;
    pending_withdrawals?: number;
    pending_balance?: number;
    total_withdrawn?: number;
    contact_unlock_earnings?: number;
    referral_earnings?: number;
  };
};

type WalletTransaction = {
  id: number;
  type?: "credit" | "debit" | string;
  category?: "unlock" | "withdraw" | string;
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

type PaginatedPayload<T> = {
  data?: T[];
  current_page?: number;
  last_page?: number;
  total?: number;
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

function normalizePage<T>(payload: PaginatedPayload<T> | T[] | null | undefined): {
  items: T[];
  meta: PageMeta;
} {
  const page = Array.isArray(payload) ? null : payload;
  return {
    items: asList<T>(payload),
    meta: {
      currentPage: page?.current_page ?? 1,
      lastPage: page?.last_page ?? 1,
      total: page?.total ?? asList<T>(payload).length,
    },
  };
}

function statusClass(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "success":
    case "approved":
    case "earned":
      return "bg-secondary-soft text-secondary border-transparent";
    case "pending":
      return "bg-accent-soft text-accent-foreground border-transparent";
    case "failed":
    case "rejected":
    case "refunded":
      return "bg-destructive/10 text-destructive border-transparent";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
}

export function WalletPage() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ currentPage: 1, lastPage: 1, total: 0 });
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [walletError, setWalletError] = useState("");
  const [transactionsError, setTransactionsError] = useState("");

  const loadWallet = useCallback(async () => {
    setLoadingWallet(true);
    setWalletError("");
    try {
      const res = await recruiterService.wallet();
      setWallet(res.data ?? null);
    } catch (err) {
      setWalletError(apiErrorMessage(err, "Failed to load wallet summary"));
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    setTransactionsError("");
    try {
      const res = await recruiterService.walletTransactions({
        page,
        per_page: PER_PAGE,
        category: category === "all" ? undefined : category,
        type: type === "all" ? undefined : type,
        status: status === "all" ? undefined : status,
        search: appliedSearch || undefined,
      });
      const normalized = normalizePage<WalletTransaction>(
        res.data as PaginatedPayload<WalletTransaction>,
      );
      setTransactions(normalized.items);
      setMeta(normalized.meta);
    } catch (err) {
      setTransactions([]);
      setTransactionsError(apiErrorMessage(err, "Failed to load wallet transactions"));
    } finally {
      setLoadingTransactions(false);
    }
  }, [appliedSearch, category, page, status, type]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const cards = [
    {
      label: "Current Balance",
      value: money(wallet?.balance ?? wallet?.summary?.available_balance),
      icon: Wallet,
      tint: "bg-primary-soft text-primary",
    },
    {
      label: "Pending Balance",
      value: money(wallet?.summary?.pending_balance ?? wallet?.pending_earnings),
      icon: Clock,
      tint: "bg-accent-soft text-accent-foreground",
    },
    {
      label: "Lifetime Earnings",
      value: money(wallet?.summary?.lifetime_earnings),
      icon: TrendingUp,
      tint: "bg-secondary-soft text-secondary",
    },
    {
      label: "Unlock Earnings",
      value: money(wallet?.contact_unlock_earnings ?? wallet?.summary?.contact_unlock_earnings),
      icon: TrendingUp,
      tint: "bg-primary-soft text-primary",
    },
    {
      label: "Referral Earnings",
      value: money(wallet?.referral_earnings ?? wallet?.summary?.referral_earnings ?? 0),
      icon: TrendingDown,
      tint: "bg-muted text-muted-foreground",
    },
    {
      label: "Today",
      value: money(wallet?.today_earnings),
      icon: TrendingUp,
      tint: "bg-primary-soft text-primary",
    },
    {
      label: "This Month",
      value: money(wallet?.monthly_earnings),
      icon: TrendingUp,
      tint: "bg-secondary-soft text-secondary",
    },
  ];

  return (
    <RecruiterLayout
      title="Wallet"
      subtitle="Your earnings summary and transaction history"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/recruiter/withdraw">
            <ArrowDownToLine className="h-4 w-4" /> Withdraw
          </Link>
        </Button>
      }
    >
      {loadingWallet ? (
        <RecruiterLoadingSkeleton rows={2} />
      ) : walletError ? (
        <RecruiterErrorState message={walletError} onRetry={loadWallet} />
      ) : (
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
                <p className="font-display text-2xl font-bold">{card.value}</p>
              </div>
            );
          })}
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Transaction History</h3>
              <p className="text-sm text-muted-foreground">
                {meta.total
                  ? `${meta.total} wallet transaction${meta.total === 1 ? "" : "s"}`
                  : "Recent wallet activity"}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setAppliedSearch(search.trim());
                    setPage(1);
                  }
                }}
                className="sm:w-48"
              />
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="unlock">Unlock Income</SelectItem>
                  <SelectItem value="withdraw">Withdrawal</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Credit/Debit</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {loadingTransactions ? (
            <RecruiterLoadingSkeleton rows={4} />
          ) : transactionsError ? (
            <RecruiterErrorState message={transactionsError} onRetry={loadTransactions} />
          ) : transactions.length === 0 ? (
            <RecruiterEmptyState
              title="No transactions yet"
              description="Unlock earnings and withdrawal requests will appear here."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const isDebit = transaction.type === "debit";
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="font-medium">
                              {transaction.title || "Wallet transaction"}
                            </div>
                            {transaction.subtitle && (
                              <div className="text-xs text-muted-foreground">
                                {transaction.subtitle}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{titleCase(transaction.category)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {transaction.reference || "—"}
                          </TableCell>
                          <TableCell
                            className={`text-right font-semibold ${
                              isDebit ? "text-destructive" : "text-secondary"
                            }`}
                          >
                            {isDebit ? "-" : "+"} {money(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {readableDate(transaction.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusClass(transaction.status)}>
                              {titleCase(transaction.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                    disabled={page <= 1 || loadingTransactions}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= meta.lastPage || loadingTransactions}
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
