import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import {
  RecruiterConfirmDialog,
  RecruiterEmptyState,
  RecruiterErrorState,
  RecruiterLoadingSkeleton,
  apiErrorMessage,
  asList,
} from "@/components/recruiter/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  FilePenLine,
  MoreHorizontal,
  Pause,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  recruiterService,
  type RecruiterOpportunity,
} from "@/services/recruiterOpportunityService";

type Filters = {
  search: string;
  status: string;
  bucket: string;
  type: string;
  sort: string;
};

type StatusAction = "publish" | "draft" | "pause" | "close" | "reopen";
type BulkAction = StatusAction | "archive" | "delete" | "duplicate";
type ConfirmTarget = {
  kind: "archive" | "delete";
  ids: number[];
  label: string;
};

type PaginatedMeta = {
  current_page?: number;
  last_page?: number;
  total?: number;
};

const PER_PAGE = 10;

const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "all",
  bucket: "all",
  type: "all",
  sort: "latest",
};

const bucketTabs = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
  { value: "expired", label: "Expired" },
] as const;

const opportunityTypeOptions = [
  { value: "job", label: "Job" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
  { value: "urgent", label: "Urgent" },
] as const;

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
] as const;

const sortOptions = [
  { value: "latest", label: "Latest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A-Z" },
  { value: "applications", label: "Most applications" },
  { value: "views", label: "Most views" },
  { value: "deadline", label: "Deadline soon" },
  { value: "salary", label: "Highest salary" },
] as const;

const statusActions: Array<{
  action: StatusAction;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { action: "publish", label: "Publish", icon: Send },
  { action: "draft", label: "Unpublish to Draft", icon: FilePenLine },
  { action: "pause", label: "Unpublish (Pause)", icon: Pause },
  { action: "close", label: "Close", icon: XCircle },
  { action: "reopen", label: "Reopen", icon: RotateCcw },
];

const bulkActions: Array<{ action: BulkAction; label: string }> = [
  { action: "publish", label: "Publish selected" },
  { action: "draft", label: "Unpublish to draft" },
  { action: "pause", label: "Unpublish selected" },
  { action: "close", label: "Close selected" },
  { action: "reopen", label: "Reopen selected" },
  { action: "duplicate", label: "Duplicate selected" },
  { action: "archive", label: "Archive selected" },
  { action: "delete", label: "Delete selected" },
];

export function ManagePostsPage() {
  const [opportunities, setOpportunities] = useState<RecruiterOpportunity[]>([]);
  const [draftFilters, setDraftFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [summary, setSummary] = useState<{
    total?: number;
    active?: number;
    draft?: number;
    published?: number;
    closed?: number;
    expired?: number;
    archived?: number;
    paused?: number;
    views?: number;
    applications?: number;
  } | null>(null);

  const selectedCount = selectedIds.length;
  const isBusy = savingAction !== null;

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [response, summaryRes] = await Promise.all([
        recruiterService.listOpportunities({
          page,
          per_page: PER_PAGE,
          search: filters.search || undefined,
          bucket: filters.bucket === "all" ? undefined : filters.bucket,
          status:
            filters.bucket === "all" && filters.status !== "all" ? filters.status : undefined,
          type: filters.type === "all" ? undefined : filters.type,
          sort: filters.sort,
        }),
        recruiterService.opportunitySummary().catch(() => null),
      ]);

      const payload = response.data;
      const nextOpportunities = asList<RecruiterOpportunity>(payload);
      const meta = Array.isArray(payload) ? null : (payload as PaginatedMeta);

      setOpportunities(nextOpportunities);
      setLastPage(meta?.last_page ?? 1);
      setTotal(meta?.total ?? nextOpportunities.length);
      if (summaryRes?.data) {
        setSummary(summaryRes.data as typeof summary);
      }
      setSelectedIds((current) =>
        current.filter((id) => nextOpportunities.some((opportunity) => opportunity.id === id)),
      );
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load posts");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities, refreshKey]);

  const reload = () => setRefreshKey((current) => current + 1);

  const applyFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setFilters({
      ...draftFilters,
      search: draftFilters.search.trim(),
    });
    setSelectedIds([]);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setSelectedIds([]);
    setPage(1);
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds((current) =>
      current.length === opportunities.length
        ? []
        : opportunities.map((opportunity) => opportunity.id),
    );
  };

  const runAction = async (key: string, action: () => Promise<unknown>, successMessage: string) => {
    setSavingAction(key);
    try {
      await action();
      toast.success(successMessage);
      reload();
      return true;
    } catch (err) {
      toast.error(apiErrorMessage(err));
      return false;
    } finally {
      setSavingAction(null);
    }
  };

  const runStatusAction = (opportunity: RecruiterOpportunity, action: StatusAction) => {
    const label = statusActions.find((item) => item.action === action)?.label ?? action;
    void runAction(
      `${action}-${opportunity.id}`,
      () => statusActionRequest(action, opportunity.id),
      `${label} action completed`,
    );
  };

  const duplicateOpportunity = (opportunity: RecruiterOpportunity) => {
    void runAction(
      `duplicate-${opportunity.id}`,
      () => recruiterService.duplicateOpportunity(opportunity.id),
      "Post duplicated",
    );
  };

  const openConfirm = (kind: "archive" | "delete", ids: number[], label: string) => {
    setConfirmTarget({ kind, ids, label });
  };

  const runBulkAction = (action: BulkAction) => {
    if (selectedIds.length === 0) return;

    const label = `${selectedIds.length} ${selectedIds.length === 1 ? "post" : "posts"}`;
    if (action === "archive" || action === "delete") {
      openConfirm(action, selectedIds, label);
      return;
    }

    void runAction(
      `bulk-${action}`,
      () => recruiterService.bulkOpportunities({ ids: selectedIds, action }),
      bulkSuccessMessage(action, selectedIds.length),
    ).then((ok) => {
      if (ok) setSelectedIds([]);
    });
  };

  const runConfirmedAction = async () => {
    if (!confirmTarget) return;

    const { kind, ids } = confirmTarget;
    const successMessage = kind === "delete" ? "Post deleted" : "Post archived";
    const bulkSuccess =
      kind === "delete" ? `${ids.length} posts deleted` : `${ids.length} posts archived`;

    const ok = await runAction(
      `${kind}-${ids.join("-")}`,
      () =>
        ids.length === 1
          ? kind === "delete"
            ? recruiterService.deleteOpportunity(ids[0])
            : recruiterService.archiveOpportunity(ids[0])
          : recruiterService.bulkOpportunities({ ids, action: kind }),
      ids.length === 1 ? successMessage : bulkSuccess,
    );

    if (ok) {
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      setConfirmTarget(null);
    }
  };

  const selectedAll = opportunities.length > 0 && selectedIds.length === opportunities.length;
  const pageStart = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const pageEnd = Math.min(
    total || opportunities.length,
    (page - 1) * PER_PAGE + opportunities.length,
  );

  const confirmCopy = useMemo(() => {
    if (!confirmTarget) {
      return {
        title: "",
        description: "",
        confirmLabel: "Confirm",
        destructive: false,
      };
    }

    if (confirmTarget.kind === "delete") {
      return {
        title: "Delete post?",
        description: `This will permanently delete ${confirmTarget.label}. This action cannot be undone.`,
        confirmLabel: "Delete",
        destructive: true,
      };
    }

    return {
      title: "Archive post?",
      description: `This will archive ${confirmTarget.label}. You can filter archived posts later if needed.`,
      confirmLabel: "Archive",
      destructive: false,
    };
  }, [confirmTarget]);

  return (
    <RecruiterLayout
      title="My Opportunities"
      subtitle="Edit, publish and track every opportunity you've posted"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/recruiter/post-new">
            <Plus className="h-4 w-4" /> New Post
          </Link>
        </Button>
      }
    >
      {summary && (
        <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {[
            ["Total", summary.total],
            ["Active", summary.active ?? summary.published],
            ["Drafts", summary.draft],
            ["Closed", summary.closed],
            ["Expired", summary.expired],
            ["Paused", summary.paused],
            ["Views", summary.views],
            ["Applications", summary.applications],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-border bg-card p-3 shadow-card">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-xl font-bold">{Number(value ?? 0)}</p>
            </div>
          ))}
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {bucketTabs.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={filters.bucket === tab.value ? "brand" : "outline"}
            onClick={() => {
              setDraftFilters((current) => ({ ...current, bucket: tab.value, status: "all" }));
              setFilters((current) => ({ ...current, bucket: tab.value, status: "all" }));
              setPage(1);
            }}
          >
            {tab.label}
            {tab.value === "active" && summary?.active != null ? ` (${summary.active})` : ""}
            {tab.value === "draft" && summary?.draft != null ? ` (${summary.draft})` : ""}
            {tab.value === "closed" && summary?.closed != null ? ` (${summary.closed})` : ""}
            {tab.value === "expired" && summary?.expired != null ? ` (${summary.expired})` : ""}
          </Button>
        ))}
      </div>

      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, company, location, skills..."
              value={draftFilters.search}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, search: event.target.value }))
              }
              className="pl-9"
            />
          </div>

          <Select
            value={draftFilters.type}
            onValueChange={(value) => setDraftFilters((current) => ({ ...current, type: value }))}
          >
            <SelectTrigger className="lg:col-span-2">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {opportunityTypeOptions.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={draftFilters.status}
            onValueChange={(value) => setDraftFilters((current) => ({ ...current, status: value }))}
          >
            <SelectTrigger className="lg:col-span-2">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={draftFilters.sort}
            onValueChange={(value) => setDraftFilters((current) => ({ ...current, sort: value }))}
          >
            <SelectTrigger className="lg:col-span-2">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((sort) => (
                <SelectItem key={sort.value} value={sort.value}>
                  {sort.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 lg:col-span-2 lg:justify-end">
            <Button type="submit" variant="brand" disabled={loading}>
              Apply
            </Button>
            <Button type="button" variant="outline" disabled={loading} onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </form>

      {selectedCount > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-medium">
              {selectedCount} {selectedCount === 1 ? "post" : "posts"} selected
            </p>
            <div className="flex flex-wrap gap-2">
              {bulkActions.map((action) => (
                <Button
                  key={action.action}
                  type="button"
                  size="sm"
                  variant={action.action === "delete" ? "destructive" : "outline"}
                  disabled={isBusy}
                  onClick={() => runBulkAction(action.action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-border bg-card shadow-card">
        {loading ? (
          <div className="p-4 sm:p-5">
            <RecruiterLoadingSkeleton rows={6} />
          </div>
        ) : error ? (
          <div className="p-4 sm:p-5">
            <RecruiterErrorState message={error} onRetry={() => void loadOpportunities()} />
          </div>
        ) : opportunities.length === 0 ? (
          <div className="p-4 sm:p-5">
            <RecruiterEmptyState
              title="No posts found"
              description="Try adjusting filters or publish your first opportunity."
              action={
                <Button asChild variant="brand" size="sm">
                  <Link to="/recruiter/post-new">
                    <Plus className="h-4 w-4" /> New Post
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        aria-label="Select all posts"
                        checked={selectedAll}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Opportunity Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Applications</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunities.map((opportunity) => (
                    <TableRow key={opportunity.id}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${opportunity.title}`}
                          checked={selectedIds.includes(opportunity.id)}
                          onCheckedChange={() => toggleSelected(opportunity.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{opportunity.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {opportunity.company_name} · {opportunity.location || "Remote"} ·{" "}
                          {opportunity.work_mode || "Hybrid"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {typeLabel(opportunity.opportunity_type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          status={
                            (opportunity as RecruiterOpportunity & { display_status?: string })
                              .display_status || opportunity.status
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {numberLabel(opportunity.applications_count)}
                      </TableCell>
                      <TableCell className="text-right">{numberLabel(opportunity.views)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(opportunity.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(
                          (opportunity as RecruiterOpportunity & { expiry_date?: string | null })
                            .expiry_date || opportunity.application_deadline,
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <PreviewLink id={opportunity.id} title={opportunity.title} />
                          <EditLink id={opportunity.id} title={opportunity.title} />
                          <IconButton
                            title="Duplicate"
                            disabled={isBusy}
                            onClick={() => duplicateOpportunity(opportunity)}
                          >
                            <Copy className="h-4 w-4" />
                          </IconButton>
                          <RowActions
                            disabled={isBusy}
                            opportunity={opportunity}
                            onStatusAction={runStatusAction}
                            onArchive={() =>
                              openConfirm("archive", [opportunity.id], opportunity.title)
                            }
                            onDelete={() =>
                              openConfirm("delete", [opportunity.id], opportunity.title)
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4 p-4 md:hidden">
              {opportunities.map((opportunity) => (
                <article
                  key={opportunity.id}
                  className="rounded-2xl border border-border bg-surface p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <Checkbox
                        className="mt-1"
                        aria-label={`Select ${opportunity.title}`}
                        checked={selectedIds.includes(opportunity.id)}
                        onCheckedChange={() => toggleSelected(opportunity.id)}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{opportunity.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {opportunity.company_name} · {opportunity.location || "Remote"} ·{" "}
                          {opportunity.work_mode || "Hybrid"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                            {typeLabel(opportunity.opportunity_type)}
                          </span>
                          <StatusPill
                            status={
                              (opportunity as RecruiterOpportunity & { display_status?: string })
                                .display_status || opportunity.status
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{numberLabel(opportunity.applications_count)}</p>
                      <p className="text-xs text-muted-foreground">Apps</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-1">
                      Views {numberLabel(opportunity.views)}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1">
                      Created {formatDate(opportunity.created_at)}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1">
                      Expiry{" "}
                      {formatDate(
                        (opportunity as RecruiterOpportunity & { expiry_date?: string | null })
                          .expiry_date || opportunity.application_deadline,
                      )}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button asChild className="w-full" variant="outline" size="sm">
                      <Link
                        to="/recruiter/post-new"
                        search={{ id: String(opportunity.id) } as never}
                      >
                        <Pencil className="h-4 w-4" /> Edit
                      </Link>
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => duplicateOpportunity(opportunity)}
                    >
                      <Copy className="h-4 w-4" /> Duplicate
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {statusActions.slice(0, 4).map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.action}
                          className="w-full"
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => runStatusAction(opportunity, action.action)}
                        >
                          <Icon className="h-4 w-4" /> {action.label}
                        </Button>
                      );
                    })}
                    <Button
                      className="w-full"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => runStatusAction(opportunity, "reopen")}
                    >
                      <RotateCcw className="h-4 w-4" /> Reopen
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => openConfirm("archive", [opportunity.id], opportunity.title)}
                    >
                      <Archive className="h-4 w-4" /> Archive
                    </Button>
                    <Button
                      className="w-full"
                      variant="destructive"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => openConfirm("delete", [opportunity.id], opportunity.title)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">
                Showing {pageStart}-{pageEnd} of {total || opportunities.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <span className="px-2 text-xs text-muted-foreground">
                  Page {page} of {lastPage}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || page >= lastPage}
                  onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <RecruiterConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        destructive={confirmCopy.destructive}
        onConfirm={() => void runConfirmedAction()}
      />
    </RecruiterLayout>
  );
}

export const ManagePosts = ManagePostsPage;

function RowActions({
  opportunity,
  disabled,
  onStatusAction,
  onArchive,
  onDelete,
}: {
  opportunity: RecruiterOpportunity;
  disabled: boolean;
  onStatusAction: (opportunity: RecruiterOpportunity, action: StatusAction) => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="More actions"
          disabled={disabled}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusActions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.action}
              disabled={disabled}
              onSelect={() => onStatusAction(opportunity, action.action)}
            >
              <Icon className="h-4 w-4" /> {action.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={disabled} onSelect={onArchive}>
          <Archive className="h-4 w-4" /> Archive
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={disabled}
          className="text-destructive focus:text-destructive"
          onSelect={onDelete}
        >
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EditLink({ id, title }: { id: number; title: string }) {
  return (
    <Link
      to="/recruiter/post-new"
      search={{ id: String(id) } as never}
      title={`Edit ${title}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Pencil className="h-4 w-4" />
    </Link>
  );
}

function PreviewLink({ id, title }: { id: number; title: string }) {
  return (
    <Link
      to="/recruiter/post-new"
      search={{ id: String(id), preview: "1" } as never}
      title={`Preview ${title}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Eye className="h-4 w-4" />
    </Link>
  );
}

function IconButton({
  children,
  title,
  disabled,
  onClick,
}: {
  children: ReactNode;
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const key = normalizeStatus(status);
  const map: Record<string, string> = {
    published: "bg-secondary-soft text-secondary",
    draft: "bg-muted text-muted-foreground",
    paused: "bg-accent-soft text-accent-foreground",
    closed: "bg-destructive/10 text-destructive",
    expired: "bg-destructive/10 text-destructive",
    archived: "bg-foreground/10 text-foreground",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[key] ?? map.draft}`}>
      {statusLabel(status)}
    </span>
  );
}

function statusActionRequest(action: StatusAction, id: number) {
  switch (action) {
    case "publish":
      return recruiterService.publishExisting(id);
    case "draft":
      return recruiterService.draftOpportunity(id);
    case "pause":
      return recruiterService.pauseOpportunity(id);
    case "close":
      return recruiterService.closeOpportunity(id);
    case "reopen":
      return recruiterService.reopenOpportunity(id);
  }
}

function bulkSuccessMessage(action: BulkAction, count: number) {
  const subject = `${count} ${count === 1 ? "post" : "posts"}`;
  const labels: Record<BulkAction, string> = {
    publish: "published",
    draft: "moved to draft",
    pause: "paused",
    close: "closed",
    reopen: "reopened",
    archive: "archived",
    delete: "deleted",
    duplicate: "duplicated",
  };
  return `${subject} ${labels[action]}`;
}

function typeLabel(type: string) {
  return (
    opportunityTypeOptions.find((option) => option.value === type)?.label ??
    titleCase(type || "opportunity")
  );
}

function statusLabel(status: string) {
  return titleCase(normalizeStatus(status));
}

function normalizeStatus(status: string) {
  return (status || "draft").toLowerCase();
}

function titleCase(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function numberLabel(value?: number | null) {
  return Number(value ?? 0).toLocaleString();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
