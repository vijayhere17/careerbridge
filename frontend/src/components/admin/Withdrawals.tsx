import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingSkeleton,
  apiErrorMessage,
  formatDate,
} from "@/components/admin/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  adminService,
  type AdminWithdrawItem,
} from "@/services/adminService";

function money(value?: number | string | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function AdminWithdrawalsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AdminWithdrawItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [remarks, setRemarks] = useState<Record<number, string>>({});

  const load = async (nextPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.listWithdrawals({
        search,
        status: status === "all" ? undefined : status,
        page: nextPage,
        per_page: 12,
      });
      setItems(res.data.items);
      setPage(res.data.pagination.current_page);
      setLastPage(res.data.pagination.last_page);
      setTotal(res.data.pagination.total);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load withdrawal requests."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const review = async (id: number, nextStatus: "approved" | "rejected") => {
    setSaving(true);
    try {
      await adminService.reviewWithdrawal(id, {
        status: nextStatus,
        admin_remarks: remarks[id]?.trim() || undefined,
      });
      toast.success(nextStatus === "approved" ? "Withdrawal approved" : "Withdrawal rejected");
      await load(page);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update withdrawal"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Withdrawals" subtitle={`${total} requests`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search recruiter name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load(1)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="brand" onClick={() => void load(1)}>
          Search
        </Button>
      </div>

      {loading && <AdminLoadingSkeleton />}
      {!loading && error && <AdminErrorState message={error} onRetry={() => load(page)} />}
      {!loading && !error && items.length === 0 && (
        <AdminEmptyState title="No withdrawal requests found" />
      )}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border bg-surface px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.user?.name || "Recruiter"}</p>
                  <p className="text-sm text-muted-foreground">{item.user?.email}</p>
                  <p className="mt-1 text-sm">
                    {money(item.amount)} · {item.bank_name || "Bank"} ·{" "}
                    {item.account_number || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.account_holder ? `${item.account_holder} · ` : ""}
                    {item.ifsc ? `IFSC ${item.ifsc}` : ""}
                    {item.upi ? ` · UPI ${item.upi}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested {formatDate(item.created_at)}
                  </p>
                </div>
                <Badge variant="outline">{item.status}</Badge>
              </div>

              {item.status === "pending" && (
                <div className="mt-3 space-y-2">
                  <Label htmlFor={`remarks-${item.id}`}>Admin notes</Label>
                  <Textarea
                    id={`remarks-${item.id}`}
                    rows={2}
                    value={remarks[item.id] || ""}
                    onChange={(e) =>
                      setRemarks((current) => ({ ...current, [item.id]: e.target.value }))
                    }
                    placeholder="Optional notes for approve/reject"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="brand"
                      disabled={saving}
                      onClick={() => void review(item.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={saving}
                      onClick={() => void review(item.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {item.admin_remarks && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Admin notes: {item.admin_remarks}
                </p>
              )}
            </article>
          ))}

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {lastPage}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => void load(page - 1)}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= lastPage || loading}
                onClick={() => void load(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
