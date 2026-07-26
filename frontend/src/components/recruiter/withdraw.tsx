import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Send, Wallet } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { recruiterService } from "@/services/recruiterOpportunityService";

type WithdrawSummary = {
  available_balance?: number;
  wallet_balance?: number;
  current_balance?: number;
  pending?: number;
  withdrawn?: number;
  minimum_withdraw?: number;
  history?: PaginatedPayload<WithdrawItem> | WithdrawItem[];
};

type WithdrawItem = {
  id: number;
  amount?: number | string | null;
  bank_name?: string | null;
  account_number?: string | null;
  remarks?: string | null;
  status?: string | null;
  admin_remarks?: string | null;
  processed_at?: string | null;
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

const emptyForm = {
  amount: "",
  bank_name: "",
  account_holder: "",
  account_number: "",
  ifsc: "",
  upi: "",
  remarks: "",
};

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

function maskAccount(value?: string | null) {
  if (!value) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  return `••${trimmed.slice(-4)}`;
}

function normalizeHistory(payload: WithdrawSummary | null | undefined): {
  items: WithdrawItem[];
  meta: PageMeta;
} {
  const history = payload?.history;
  const items = asList<WithdrawItem>(history);
  return {
    items,
    meta: {
      currentPage: history?.current_page ?? 1,
      lastPage: history?.last_page ?? 1,
      total: history?.total ?? items.length,
    },
  };
}

function statusClass(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "approved":
    case "completed":
      return "bg-secondary-soft text-secondary border-transparent";
    case "pending":
      return "bg-accent-soft text-accent-foreground border-transparent";
    case "rejected":
    case "failed":
      return "bg-destructive/10 text-destructive border-transparent";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
}

export function WithdrawPage() {
  const [summary, setSummary] = useState<WithdrawSummary | null>(null);
  const [history, setHistory] = useState<WithdrawItem[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ currentPage: 1, lastPage: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const available = Number(summary?.available_balance ?? 0);
  const minimumWithdraw = Number(summary?.minimum_withdraw ?? 500);

  const loadSummary = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      setError("");
      try {
        const res = await recruiterService.withdrawSummary({
          page: targetPage,
          per_page: PER_PAGE,
          status: statusFilter === "all" ? undefined : statusFilter,
        });
        const data = res.data ?? null;
        const normalized = normalizeHistory(data);
        setSummary(data);
        setHistory(normalized.items);
        setMeta(normalized.meta);
      } catch (err) {
        const message = apiErrorMessage(err, "Failed to load withdrawal details");
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter],
  );

  useEffect(() => {
    loadSummary(page);
  }, [loadSummary, page]);

  const update = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const amount = Number(form.amount);

    if (!form.amount || Number.isNaN(amount)) {
      nextErrors.amount = "Enter a valid withdrawal amount.";
    } else if (amount < minimumWithdraw) {
      nextErrors.amount = `Minimum withdrawal amount is ${money(minimumWithdraw)}.`;
    } else if (amount > available) {
      nextErrors.amount = `Amount cannot exceed your available balance of ${money(available)}.`;
    }

    if (!form.bank_name.trim()) {
      nextErrors.bank_name = "Bank name is required.";
    }

    if (!form.account_holder.trim()) {
      nextErrors.account_holder = "Account holder name is required.";
    }

    if (!form.account_number.trim()) {
      nextErrors.account_number = "Account number is required.";
    }

    if (!form.ifsc.trim() && !form.upi.trim()) {
      nextErrors.ifsc = "Provide IFSC or UPI for payout.";
      nextErrors.upi = "Provide UPI or IFSC for payout.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) {
      toast.error("Please fix the withdrawal form errors.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await recruiterService.requestWithdraw({
        amount: Number(form.amount),
        bank_name: form.bank_name.trim(),
        account_holder: form.account_holder.trim(),
        account_number: form.account_number.trim(),
        ifsc: form.ifsc.trim() || undefined,
        upi: form.upi.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
      });
      toast.success("Withdrawal request submitted");
      setForm(emptyForm);
      setErrors({});
      if (page !== 1) {
        setPage(1);
      }
      await loadSummary(1);
    } catch (err) {
      const message = apiErrorMessage(err, "Could not submit withdrawal request");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const cards = [
    {
      label: "Available Balance",
      value: money(summary?.available_balance),
      icon: Wallet,
      tint: "bg-primary-soft text-primary",
    },
    {
      label: "Pending Withdrawals",
      value: money(summary?.pending),
      icon: Clock,
      tint: "bg-accent-soft text-accent-foreground",
    },
    {
      label: "Withdrawn",
      value: money(summary?.withdrawn),
      icon: CheckCircle2,
      tint: "bg-secondary-soft text-secondary",
    },
  ];

  return (
    <RecruiterLayout
      title="Withdraw Request"
      subtitle="Move your earnings to a linked bank account"
    >
      {loading && !summary ? (
        <RecruiterLoadingSkeleton rows={5} />
      ) : (
        <>
          {error && <RecruiterErrorState message={error} onRetry={() => loadSummary(page)} />}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <form
              onSubmit={submit}
              className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-2"
            >
              <h3 className="font-semibold">Request withdrawal</h3>
              <p className="text-sm text-muted-foreground">
                Withdrawals are processed after review. Minimum request amount is{" "}
                {money(minimumWithdraw)}.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={minimumWithdraw}
                    step="1"
                    placeholder={`e.g. ${Math.max(minimumWithdraw * 2, 1000)}`}
                    value={form.amount}
                    onChange={(event) => update("amount", event.target.value)}
                    aria-invalid={!!errors.amount}
                  />
                  <p
                    className={
                      errors.amount ? "text-xs text-destructive" : "text-xs text-muted-foreground"
                    }
                  >
                    {errors.amount || `Min ${money(minimumWithdraw)} · Available ${money(available)}`}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank name</Label>
                  <Input
                    id="bank_name"
                    placeholder="e.g. HDFC Bank"
                    value={form.bank_name}
                    onChange={(event) => update("bank_name", event.target.value)}
                    aria-invalid={!!errors.bank_name}
                  />
                  {errors.bank_name && (
                    <p className="text-xs text-destructive">{errors.bank_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_holder">Account holder</Label>
                  <Input
                    id="account_holder"
                    placeholder="Name as per bank account"
                    value={form.account_holder}
                    onChange={(event) => update("account_holder", event.target.value)}
                    aria-invalid={!!errors.account_holder}
                  />
                  {errors.account_holder && (
                    <p className="text-xs text-destructive">{errors.account_holder}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account number</Label>
                  <Input
                    id="account_number"
                    placeholder="Account number"
                    value={form.account_number}
                    onChange={(event) => update("account_number", event.target.value)}
                    aria-invalid={!!errors.account_number}
                  />
                  {errors.account_number && (
                    <p className="text-xs text-destructive">{errors.account_number}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC</Label>
                  <Input
                    id="ifsc"
                    placeholder="e.g. HDFC0001234"
                    value={form.ifsc}
                    onChange={(event) => update("ifsc", event.target.value.toUpperCase())}
                    aria-invalid={!!errors.ifsc}
                  />
                  {errors.ifsc && <p className="text-xs text-destructive">{errors.ifsc}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upi">UPI ID</Label>
                  <Input
                    id="upi"
                    placeholder="name@bank"
                    value={form.upi}
                    onChange={(event) => update("upi", event.target.value)}
                    aria-invalid={!!errors.upi}
                  />
                  {errors.upi && <p className="text-xs text-destructive">{errors.upi}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="remarks">Remarks (optional)</Label>
                  <Textarea
                    id="remarks"
                    rows={3}
                    placeholder="Any note for finance team..."
                    value={form.remarks}
                    onChange={(event) => update("remarks", event.target.value)}
                  />
                </div>
              </div>
              <div className="mt-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-xs text-muted-foreground">
                  Your pending withdrawals are deducted from available balance.
                </p>
                <Button variant="brand" type="submit" disabled={saving || loading}>
                  <Send className="h-4 w-4" /> {saving ? "Submitting..." : "Submit request"}
                </Button>
              </div>
            </form>

            <div className="rounded-2xl border border-border bg-primary-soft/40 p-6">
              <h4 className="font-semibold">Payout details</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Minimum withdrawal amount is {money(minimumWithdraw)}.</li>
                <li>• Bank name and account number are required.</li>
                <li>• Requests remain pending until approved by finance.</li>
                <li>• Rejected requests include admin remarks when provided.</li>
              </ul>
            </div>
          </section>

          <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Withdrawal history</h3>
                <p className="text-sm text-muted-foreground">
                  {meta.total
                    ? `${meta.total} request${meta.total === 1 ? "" : "s"}`
                    : "Your submitted requests"}
                </p>
              </div>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="p-4 sm:p-5">
              {loading ? (
                <RecruiterLoadingSkeleton rows={3} />
              ) : history.length === 0 ? (
                <RecruiterEmptyState
                  title="No withdrawals yet"
                  description="Your withdrawal requests will appear here after submission."
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Admin Notes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((withdraw) => (
                          <TableRow key={withdraw.id}>
                            <TableCell className="text-right font-semibold">
                              {money(withdraw.amount)}
                            </TableCell>
                            <TableCell>{withdraw.bank_name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {maskAccount(withdraw.account_number)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {readableDate(withdraw.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusClass(withdraw.status)}>
                                {titleCase(withdraw.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs text-sm text-muted-foreground">
                              {withdraw.admin_remarks || withdraw.remarks || "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {withdraw.status === "pending" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={saving}
                                  onClick={async () => {
                                    setSaving(true);
                                    try {
                                      await recruiterService.cancelWithdraw(withdraw.id);
                                      toast.success("Withdrawal cancelled");
                                      await loadSummary(page);
                                    } catch (err) {
                                      toast.error(apiErrorMessage(err, "Could not cancel request"));
                                    } finally {
                                      setSaving(false);
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              ) : (
                                "—"
                              )}
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
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= meta.lastPage || loading}
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
        </>
      )}
    </RecruiterLayout>
  );
}
