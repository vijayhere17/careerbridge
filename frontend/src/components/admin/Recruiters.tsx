import { useEffect, useMemo, useState } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { CheckCircle2, Eye, Search, XCircle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminConfirmDialog,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingSkeleton,
  StatusPill,
  apiErrorMessage,
  formatDate,
  typeLabel,
} from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminService,
  type AdminRecruiterListItem,
  type AdminReviewAction,
} from "@/services/adminService";

function useQueryParams() {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  return useMemo(
    () => new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr),
    [searchStr],
  );
}

export function AdminRecruitersPage() {
  const router = useRouter();
  const query = useQueryParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [items, setItems] = useState<AdminRecruiterListItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState(query.get("search") ?? "");
  const [status, setStatus] = useState(query.get("status") ?? "all");
  const [type, setType] = useState(query.get("type") ?? "all");
  const [sort, setSort] = useState<"newest" | "oldest">(
    (query.get("sort") as "newest" | "oldest") || "newest",
  );
  const [dateFrom, setDateFrom] = useState(query.get("date_from") ?? "");
  const [dateTo, setDateTo] = useState(query.get("date_to") ?? "");
  const [pendingAction, setPendingAction] = useState<{
    userId: number;
    action: AdminReviewAction;
    company?: string | null;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(query.get("status") ?? "all");
  }, [query]);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.listRecruiters({
        status,
        type,
        search,
        date_from: dateFrom,
        date_to: dateTo,
        sort,
        page: nextPage,
        per_page: 12,
      });
      setItems(res.data.items);
      setPage(res.data.pagination.current_page);
      setLastPage(res.data.pagination.last_page);
      setTotal(res.data.pagination.total);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load recruiters."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, sort, dateFrom, dateTo]);

  const runQuickAction = async () => {
    if (!pendingAction) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await adminService.review(pendingAction.userId, { action: pendingAction.action });
      setSuccess(
        pendingAction.action === "approve"
          ? "Recruiter approved successfully."
          : "Recruiter rejected successfully.",
      );
      setPendingAction(null);
      await load(page);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update recruiter."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Recruiter Approvals" subtitle={`${total} recruiters`}>
      <div className="mb-5 grid gap-3 rounded-2xl border border-border bg-surface p-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="relative xl:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search company, recruiter, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load(1)}
          />
        </div>
        <select
          className="auth-input h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="ChangesRequested">Changes requested</option>
          <option value="Suspended">Suspended</option>
        </select>
        <select
          className="auth-input h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">All types</option>
          <option value="company">Company Recruiters</option>
          <option value="individual">Individual Recruiters</option>
          <option value="company_recruiter">Company Recruiter</option>
          <option value="individual_recruiter">Individual Recruiter</option>
          <option value="startup">Startup</option>
          <option value="consultancy">Consultancy</option>
        </select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <select
          className="auth-input h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "oldest")}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <Button variant="brand" onClick={() => void load(1)}>
          Apply filters
        </Button>
      </div>

      {success && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {success}
        </div>
      )}

      {loading && <AdminLoadingSkeleton rows={5} />}
      {!loading && error && <AdminErrorState message={error} onRetry={() => load(page)} />}
      {!loading && !error && items.length === 0 && (
        <AdminEmptyState title="No recruiters found" description="Try adjusting filters or search." />
      )}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const canApprove = item.approval_status === "Pending" || item.approval_status === "ChangesRequested";
            const canReject = canApprove;

            return (
              <div
                key={item.user_id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 flex-col gap-3 text-left sm:flex-row sm:items-center"
                  onClick={() =>
                    void router.navigate({
                      to: "/admin/recruiters/$userId",
                      params: { userId: String(item.user_id) },
                    })
                  }
                >
                  {item.company_logo ? (
                    <img src={item.company_logo} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary/10 font-semibold text-primary">
                      {(item.company_name || item.recruiter_name || "R").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{item.company_name || "Untitled company"}</p>
                      <StatusPill status={item.approval_status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.recruiter_name} · {item.email} · {item.phone || "No phone"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {typeLabel(item.recruiter_type)} · {item.industry || "No industry"} ·{" "}
                      {item.company_size || "—"} · {item.location || "—"}
                    </p>
                  </div>
                  <div className="text-left text-sm sm:text-right">
                    <p className="font-semibold text-primary">{item.profile_completion}%</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.registration_date)}</p>
                  </div>
                </button>

                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch lg:flex-row">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void router.navigate({
                        to: "/admin/recruiters/$userId",
                        params: { userId: String(item.user_id) },
                      })
                    }
                  >
                    <Eye className="mr-1.5 h-4 w-4" />
                    View details
                  </Button>
                  {canApprove && (
                    <Button
                      size="sm"
                      variant="brand"
                      disabled={saving}
                      onClick={() =>
                        setPendingAction({
                          userId: item.user_id,
                          action: "approve",
                          company: item.company_name || item.recruiter_name,
                        })
                      }
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={saving}
                      onClick={() =>
                        setPendingAction({
                          userId: item.user_id,
                          action: "reject",
                          company: item.company_name || item.recruiter_name,
                        })
                      }
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Page {page} of {lastPage}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => void load(page - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= lastPage}
                onClick={() => void load(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingAction && (
        <AdminConfirmDialog
          open={!!pendingAction}
          onOpenChange={(open) => !open && setPendingAction(null)}
          title={
            pendingAction.action === "approve"
              ? `Approve ${pendingAction.company || "recruiter"}?`
              : `Reject ${pendingAction.company || "recruiter"}?`
          }
          description={
            pendingAction.action === "approve"
              ? "This recruiter will immediately gain dashboard access."
              : "The recruiter will be blocked until they update and resubmit."
          }
          confirmLabel={pendingAction.action === "approve" ? "Approve" : "Reject"}
          destructive={pendingAction.action === "reject"}
          onConfirm={() => void runQuickAction()}
        />
      )}
    </AdminLayout>
  );
}
