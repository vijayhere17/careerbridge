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
import { adminService, type AdminUserListItem } from "@/services/adminService";

export function AdminUsersListPage({
  kind,
}: {
  kind: "mentors" | "seekers";
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const title = kind === "mentors" ? "Mentors" : "Job Seekers";

  const load = async (nextPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const res =
        kind === "mentors"
          ? await adminService.listMentors({ search, page: nextPage, per_page: 12 })
          : await adminService.listSeekers({ search, page: nextPage, per_page: 12 });
      setItems(res.data.items);
      setPage(res.data.pagination.current_page);
      setLastPage(res.data.pagination.last_page);
      setTotal(res.data.pagination.total);
    } catch (err) {
      setError(apiErrorMessage(err, `Could not load ${title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  return (
    <AdminLayout title={title} subtitle={`${total} accounts`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={`Search ${title.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load(1)}
          />
        </div>
        <Button variant="brand" onClick={() => void load(1)}>Search</Button>
      </div>

      {loading && <AdminLoadingSkeleton />}
      {!loading && error && <AdminErrorState message={error} onRetry={() => load(page)} />}
      {!loading && !error && items.length === 0 && (
        <AdminEmptyState title={`No ${title.toLowerCase()} found`} />
      )}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((user) => (
            <div key={user.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email} · {user.mobile || "No phone"}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{user.verified_email ? "Email verified" : "Email unverified"}</p>
                <p>{formatDate(user.created_at)}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">Page {page} of {lastPage}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => void load(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => void load(page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
