import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingSkeleton,
  apiErrorMessage,
  formatDate,
} from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminService,
  type AdminMentorListItem,
  type AdminMentorReviewAction,
} from "@/services/adminService";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "profile_setup", label: "Setup Incomplete" },
];

function statusLabel(status?: string | null) {
  switch (status) {
    case "under_review":
      return "Under Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "profile_setup":
      return "Setup Incomplete";
    default:
      return status || "Unknown";
  }
}

export function AdminMentorsListPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AdminMentorListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actingId, setActingId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const load = async (nextPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await adminService.listMentors({
        search,
        status,
        page: nextPage,
        per_page: 12,
      });
      setItems(res.data.items);
      setPage(res.data.pagination.current_page);
      setLastPage(res.data.pagination.last_page);
      setTotal(res.data.pagination.total);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load mentors."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const review = async (userId: number, action: AdminMentorReviewAction) => {
    setActingId(userId);
    try {
      await adminService.reviewMentor(userId, {
        action,
        notes: notes || undefined,
      });
      setNotes("");
      await load(page);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not update mentor review."));
    } finally {
      setActingId(null);
    }
  };

  return (
    <AdminLayout title="Mentors" subtitle={`${total} accounts`}>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search mentors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load(1)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button variant="brand" onClick={() => void load(1)}>
          Search
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Optional admin notes for approve / reject / request changes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {loading && <AdminLoadingSkeleton />}
      {!loading && error && <AdminErrorState message={error} onRetry={() => load(page)} />}
      {!loading && !error && items.length === 0 && (
        <AdminEmptyState title="No mentors found" />
      )}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-border bg-surface px-4 py-3"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.email} · {user.mobile || "No phone"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[user.designation, user.company, user.industry].filter(Boolean).join(" · ") || "Profile incomplete"}
                    {" · "}
                    {statusLabel(user.onboarding_status)}
                    {user.verified ? " · Verified" : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{user.verified_email ? "Email verified" : "Email unverified"}</p>
                  <p>{formatDate(user.created_at)}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="brand"
                  disabled={actingId === user.id || user.onboarding_status === "approved"}
                  onClick={() => void review(user.id, "approve")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingId === user.id}
                  onClick={() => void review(user.id, "request_changes")}
                >
                  Request Changes
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actingId === user.id || user.onboarding_status === "rejected"}
                  onClick={() => void review(user.id, "reject")}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingId === user.id}
                  onClick={() => void review(user.id, user.available === false ? "activate" : "suspend")}
                >
                  {user.available === false ? "Activate" : "Suspend"}
                </Button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Page {page} of {lastPage}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => void load(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => void load(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
