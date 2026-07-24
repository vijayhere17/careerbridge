import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  Briefcase,
  CheckCircle2,
  Copy,
  Edit,
  FileText,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { HrLayout } from "@/components/hr/HrLayout";
import {
  HrConfirmDialog,
  HrEmptyState,
  HrErrorState,
  HrLoadingSkeleton,
  apiErrorMessage,
} from "@/components/hr/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hrService, type HRJob } from "@/services/hrService";
import { cn } from "@/lib/utils";

type JobStatus = HRJob["status"];
type BulkJobAction = "close" | "reopen" | "archive" | "publish" | "draft" | "delete";
type SortOption = "latest" | "oldest" | "title" | "applications" | "salary";

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
};

const JOB_STATUSES: { value: JobStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "on_hold", label: "On hold" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

const STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  open: "Open",
  on_hold: "On hold",
  closed: "Closed",
  archived: "Archived",
};

const statusStyles: Record<JobStatus, string> = {
  open: "bg-secondary-soft text-secondary",
  draft: "bg-muted text-muted-foreground",
  closed: "bg-destructive/10 text-destructive",
  on_hold: "bg-accent-soft text-accent-foreground",
  archived: "bg-foreground/10 text-foreground",
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A-Z" },
  { value: "applications", label: "Most applications" },
  { value: "salary", label: "Highest salary" },
];

const BULK_ACTIONS: { value: BulkJobAction; label: string }[] = [
  { value: "publish", label: "Publish" },
  { value: "draft", label: "Move to draft" },
  { value: "close", label: "Close" },
  { value: "reopen", label: "Reopen" },
  { value: "archive", label: "Archive" },
  { value: "delete", label: "Delete" },
];

const JOB_ACTION_SUCCESS: Record<BulkJobAction | "duplicate", string> = {
  publish: "Job published",
  draft: "Job moved to draft",
  close: "Job closed",
  reopen: "Job reopened",
  archive: "Job archived",
  delete: "Job deleted",
  duplicate: "Job duplicated",
};

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleDateString();
}

function formatSalary(job: HRJob) {
  if (job.salary_min == null && job.salary_max == null) return "Not disclosed";
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  if (job.salary_min != null && job.salary_max != null) {
    return `${formatter.format(Number(job.salary_min))} - ${formatter.format(Number(job.salary_max))}`;
  }
  if (job.salary_min != null) return `From ${formatter.format(Number(job.salary_min))}`;
  return `Up to ${formatter.format(Number(job.salary_max))}`;
}

function statusBadge(status: JobStatus) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function HrJobsPage() {
  const [jobs, setJobs] = useState<HRJob[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | JobStatus>("all");
  const [sort, setSort] = useState<SortOption>("latest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkJobAction>("publish");
  const [processing, setProcessing] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.listJobs({
        page,
        search,
        status: status === "all" ? undefined : status,
        sort,
        per_page: 12,
      });
      setJobs(res.data.data);
      setLastPage(res.data.last_page || 1);
      setTotal(res.data.total || 0);
      setSelectedIds([]);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Failed to load jobs"));
    } finally {
      setLoading(false);
    }
  }, [page, search, sort, status]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const allVisibleSelected = jobs.length > 0 && selectedIds.length === jobs.length;
  const selectedCount = selectedIds.length;

  const pageSummary = useMemo(() => {
    if (total === 0) return "No jobs";
    const first = (page - 1) * 12 + 1;
    const last = Math.min(page * 12, total);
    return `${first}-${last} of ${total} jobs`;
  }, [page, total]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const toggleJob = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    );
  };

  const toggleVisibleJobs = () => {
    setSelectedIds((current) => (current.length === jobs.length ? [] : jobs.map((job) => job.id)));
  };

  const runJobAction = async (job: HRJob, action: BulkJobAction | "duplicate") => {
    setProcessing(true);
    try {
      if (action === "publish") await hrService.publishJob(job.id);
      if (action === "draft") await hrService.draftJob(job.id);
      if (action === "close") await hrService.closeJob(job.id);
      if (action === "reopen") await hrService.reopenJob(job.id);
      if (action === "archive") await hrService.archiveJob(job.id);
      if (action === "delete") await hrService.deleteJob(job.id);
      if (action === "duplicate") await hrService.duplicateJob(job.id);

      toast.success(JOB_ACTION_SUCCESS[action]);
      await loadJobs();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, "Could not update job"));
    } finally {
      setProcessing(false);
    }
  };

  const confirmJobAction = (job: HRJob, action: "archive" | "delete") => {
    setConfirm({
      title: action === "delete" ? "Delete job?" : "Archive job?",
      description:
        action === "delete"
          ? `This permanently deletes "${job.title}" and removes it from your HR job list.`
          : `This archives "${job.title}" and closes it for new hiring activity.`,
      confirmLabel: action === "delete" ? "Delete job" : "Archive job",
      destructive: action === "delete",
      onConfirm: () => runJobAction(job, action),
    });
  };

  const runBulkAction = async (action: BulkJobAction) => {
    if (selectedIds.length === 0) return;
    setProcessing(true);
    try {
      const res = await hrService.bulkJobs({ ids: selectedIds, action });
      const updated = res.data.updated ?? selectedIds.length;
      toast.success(
        action === "delete"
          ? `${updated} job${updated === 1 ? "" : "s"} deleted`
          : `${updated} job${updated === 1 ? "" : "s"} updated`,
      );
      await loadJobs();
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, "Bulk action failed"));
    } finally {
      setProcessing(false);
    }
  };

  const applyBulkAction = () => {
    if (bulkAction === "delete" || bulkAction === "archive") {
      setConfirm({
        title: bulkAction === "delete" ? "Delete selected jobs?" : "Archive selected jobs?",
        description:
          bulkAction === "delete"
            ? `This permanently deletes ${selectedCount} selected job${selectedCount === 1 ? "" : "s"}.`
            : `This archives ${selectedCount} selected job${selectedCount === 1 ? "" : "s"} and closes them for new hiring activity.`,
        confirmLabel: bulkAction === "delete" ? "Delete selected" : "Archive selected",
        destructive: bulkAction === "delete",
        onConfirm: () => runBulkAction(bulkAction),
      });
      return;
    }
    void runBulkAction(bulkAction);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setSort("latest");
    setPage(1);
  };

  const renderRowActions = (job: HRJob, compact = false) => (
    <div className={cn("flex flex-wrap items-center gap-1", compact && "gap-2")}>
      <Button asChild variant="outline" size={compact ? "sm" : "icon"} title="Edit">
        <Link to="/hr/jobs/$id/edit" params={{ id: String(job.id) }}>
          {compact ? "Edit" : <Edit className="h-4 w-4" />}
        </Link>
      </Button>
      {job.status !== "open" && (
        <Button
          variant="ghost"
          size={compact ? "sm" : "icon"}
          disabled={processing}
          onClick={() => void runJobAction(job, "publish")}
          title="Publish"
        >
          {compact ? "Publish" : <Send className="h-4 w-4" />}
        </Button>
      )}
      {job.status !== "draft" && (
        <Button
          variant="ghost"
          size={compact ? "sm" : "icon"}
          disabled={processing}
          onClick={() => void runJobAction(job, "draft")}
          title="Move to draft"
        >
          {compact ? "Draft" : <FileText className="h-4 w-4" />}
        </Button>
      )}
      {job.status !== "closed" && job.status !== "archived" && (
        <Button
          variant="ghost"
          size={compact ? "sm" : "icon"}
          disabled={processing}
          onClick={() => void runJobAction(job, "close")}
          title="Close"
        >
          {compact ? "Close" : <Lock className="h-4 w-4" />}
        </Button>
      )}
      {(job.status === "closed" || job.status === "archived") && (
        <Button
          variant="ghost"
          size={compact ? "sm" : "icon"}
          disabled={processing}
          onClick={() => void runJobAction(job, "reopen")}
          title="Reopen"
        >
          {compact ? "Reopen" : <RefreshCw className="h-4 w-4" />}
        </Button>
      )}
      {job.status !== "archived" && (
        <Button
          variant="ghost"
          size={compact ? "sm" : "icon"}
          disabled={processing}
          onClick={() => confirmJobAction(job, "archive")}
          title="Archive"
        >
          {compact ? "Archive" : <Archive className="h-4 w-4" />}
        </Button>
      )}
      <Button
        variant="ghost"
        size={compact ? "sm" : "icon"}
        disabled={processing}
        onClick={() => void runJobAction(job, "duplicate")}
        title="Duplicate"
      >
        {compact ? "Duplicate" : <Copy className="h-4 w-4" />}
      </Button>
      <Button
        variant="ghost"
        size={compact ? "sm" : "icon"}
        disabled={processing}
        onClick={() => confirmJobAction(job, "delete")}
        title="Delete"
      >
        {compact ? "Delete" : <Trash2 className="h-4 w-4 text-destructive" />}
      </Button>
    </div>
  );

  return (
    <HrLayout
      title="Jobs"
      subtitle="Create and manage HR job openings"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/hr/jobs/create">
            <Plus className="h-4 w-4" /> Create Job
          </Link>
        </Button>
      }
    >
      <form
        onSubmit={onSearch}
        className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px_auto]"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search title, department, location..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as "all" | JobStatus);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {JOB_STATUSES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(value) => {
            setSort(value as SortOption);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {selectedCount > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium">
            {selectedCount} job{selectedCount === 1 ? "" : "s"} selected
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={bulkAction}
              onValueChange={(value) => setBulkAction(value as BulkJobAction)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Bulk action" />
              </SelectTrigger>
              <SelectContent>
                {BULK_ACTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="brand" disabled={processing} onClick={applyBulkAction}>
              Apply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={processing}
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{pageSummary}</p>
        {(search || status !== "all" || sort !== "latest") && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XCircle className="h-4 w-4" /> Clear filters
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <HrErrorState message={error} onRetry={loadJobs} />
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:block">
            <div className="space-y-0">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[44px_1.6fr_1fr_1fr_90px_90px_110px_220px] gap-3 border-b border-border p-4"
                >
                  {Array.from({ length: 8 }).map((__, cell) => (
                    <Skeleton key={cell} className="h-5 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <HrLoadingSkeleton rows={4} className="lg:hidden" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-6">
          <HrEmptyState
            title="No jobs found"
            description={
              search || status !== "all"
                ? "Try changing your search or filters."
                : "Create your first opening to start hiring."
            }
            action={
              <Button asChild variant="brand" size="sm">
                <Link to="/hr/jobs/create">
                  <Plus className="h-4 w-4" /> Create job
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleVisibleJobs}
                        aria-label="Select all visible jobs"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Openings</th>
                    <th className="px-4 py-3 font-medium">Apps</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(job.id)}
                          onChange={() => toggleJob(job.id)}
                          aria-label={`Select ${job.title}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{formatSalary(job)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{job.department ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{job.location ?? "-"}</td>
                      <td className="px-4 py-3">{job.openings}</td>
                      <td className="px-4 py-3">{job.applications_count ?? 0}</td>
                      <td className="px-4 py-3">{statusBadge(job.status)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(job.updated_at)}
                      </td>
                      <td className="px-4 py-3">{renderRowActions(job)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <input
                      className="mt-1"
                      type="checkbox"
                      checked={selectedIds.includes(job.id)}
                      onChange={() => toggleJob(job.id)}
                      aria-label={`Select ${job.title}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {job.department ?? "General"} · {job.location ?? "Remote"}
                      </p>
                    </div>
                  </div>
                  {statusBadge(job.status)}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Applications</p>
                    <p className="font-semibold">{job.applications_count ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Openings</p>
                    <p className="font-semibold">{job.openings}</p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Salary</p>
                    <p className="font-semibold">{formatSalary(job)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" /> Actions
                  </div>
                  {renderRowActions(job, true)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {lastPage}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= lastPage || loading}
                onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <HrConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={confirm?.title ?? ""}
        description={confirm?.description ?? ""}
        confirmLabel={confirm?.confirmLabel ?? "Confirm"}
        destructive={confirm?.destructive}
        onConfirm={() => {
          const confirmed = confirm;
          setConfirm(null);
          if (confirmed) void confirmed.onConfirm();
        }}
      />
    </HrLayout>
  );
}

type JobFormState = {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience: string;
  salary_min: string;
  salary_max: string;
  openings: string;
  status: JobStatus;
  description: string;
  requirements: string;
  responsibilities: string;
};

type JobFormErrors = Partial<Record<keyof JobFormState, string>>;

const emptyForm: JobFormState = {
  title: "",
  department: "",
  location: "",
  employment_type: "Full-time",
  experience: "",
  salary_min: "",
  salary_max: "",
  openings: "1",
  status: "draft",
  description: "",
  requirements: "",
  responsibilities: "",
};

function toFormState(job: HRJob): JobFormState {
  return {
    title: job.title ?? "",
    department: job.department ?? "",
    location: job.location ?? "",
    employment_type: job.employment_type ?? "Full-time",
    experience: job.experience ?? "",
    salary_min: job.salary_min != null ? String(job.salary_min) : "",
    salary_max: job.salary_max != null ? String(job.salary_max) : "",
    openings: String(job.openings ?? 1),
    status: job.status ?? "draft",
    description: job.description ?? "",
    requirements: job.requirements ?? "",
    responsibilities: job.responsibilities ?? "",
  };
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function HrJobFormPage({ jobId }: { jobId?: number }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [errors, setErrors] = useState<JobFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(!!jobId);
  const isEdit = !!jobId;

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setLoadError("");
    try {
      const res = await hrService.getJob(jobId);
      setForm(toFormState(res.data));
    } catch (err: unknown) {
      setLoadError(apiErrorMessage(err, "Failed to load job"));
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void loadJob();
  }, [loadJob]);

  const set = (key: keyof JobFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: JobFormErrors = {};
    const salaryMin = form.salary_min === "" ? null : Number(form.salary_min);
    const salaryMax = form.salary_max === "" ? null : Number(form.salary_max);
    const openings = Number(form.openings);

    if (!form.title.trim()) {
      nextErrors.title = "Job title is required.";
    }
    if (salaryMin != null && Number.isNaN(salaryMin)) {
      nextErrors.salary_min = "Salary minimum must be a valid number.";
    }
    if (salaryMax != null && Number.isNaN(salaryMax)) {
      nextErrors.salary_max = "Salary maximum must be a valid number.";
    }
    if (
      salaryMin != null &&
      salaryMax != null &&
      !Number.isNaN(salaryMin) &&
      !Number.isNaN(salaryMax) &&
      salaryMax < salaryMin
    ) {
      nextErrors.salary_max = "Salary maximum must be greater than or equal to salary minimum.";
    }
    if (!Number.isInteger(openings) || openings < 1) {
      nextErrors.openings = "Openings must be at least 1.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: Partial<HRJob> = {
      title: form.title.trim(),
      department: nullableText(form.department),
      location: nullableText(form.location),
      employment_type: nullableText(form.employment_type),
      experience: nullableText(form.experience),
      salary_min: form.salary_min === "" ? null : Number(form.salary_min),
      salary_max: form.salary_max === "" ? null : Number(form.salary_max),
      openings: Number(form.openings),
      status: form.status,
      description: nullableText(form.description),
      requirements: nullableText(form.requirements),
      responsibilities: nullableText(form.responsibilities),
    };

    setSaving(true);
    try {
      if (isEdit && jobId) {
        await hrService.updateJob(jobId, payload);
        toast.success("Job updated");
      } else {
        await hrService.createJob(payload);
        toast.success("Job created");
      }
      await navigate({ to: "/hr/jobs" });
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, "Could not save job"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrLayout
      title={isEdit ? "Edit Job" : "Create Job"}
      subtitle={isEdit ? "Update opening details" : "Add a new role to your hiring pipeline"}
    >
      {loading ? (
        <div className="max-w-3xl">
          <HrLoadingSkeleton rows={5} />
        </div>
      ) : loadError ? (
        <div className="max-w-3xl">
          <HrErrorState message={loadError} onRetry={loadJob} />
        </div>
      ) : (
        <form onSubmit={submit} className="max-w-3xl space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-5 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-lg font-semibold">Job details</h2>
                <p className="text-sm text-muted-foreground">
                  Define the role, location, compensation, and publishing status.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Job title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => set("title", event.target.value)}
                  aria-invalid={!!errors.title}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={form.department}
                  onChange={(event) => set("department", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(event) => set("location", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Employment type</Label>
                <Select
                  value={form.employment_type}
                  onValueChange={(value) => set("employment_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  value={form.experience}
                  onChange={(event) => set("experience", event.target.value)}
                  placeholder="e.g. 3-5 years"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_min">Salary min</Label>
                <Input
                  id="salary_min"
                  type="number"
                  min={0}
                  value={form.salary_min}
                  onChange={(event) => set("salary_min", event.target.value)}
                  aria-invalid={!!errors.salary_min}
                />
                {errors.salary_min && (
                  <p className="text-xs text-destructive">{errors.salary_min}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_max">Salary max</Label>
                <Input
                  id="salary_max"
                  type="number"
                  min={0}
                  value={form.salary_max}
                  onChange={(event) => set("salary_max", event.target.value)}
                  aria-invalid={!!errors.salary_max}
                />
                {errors.salary_max && (
                  <p className="text-xs text-destructive">{errors.salary_max}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="openings">Openings</Label>
                <Input
                  id="openings"
                  type="number"
                  min={1}
                  value={form.openings}
                  onChange={(event) => set("openings", event.target.value)}
                  aria-invalid={!!errors.openings}
                />
                {errors.openings && <p className="text-xs text-destructive">{errors.openings}</p>}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => set("status", value as JobStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STATUSES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-5">
              <h2 className="font-display text-lg font-semibold">Role content</h2>
              <p className="text-sm text-muted-foreground">
                Add clear information candidates and hiring managers can review.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  rows={4}
                  value={form.requirements}
                  onChange={(event) => set("requirements", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  rows={4}
                  value={form.responsibilities}
                  onChange={(event) => set("responsibilities", event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/hr/jobs" })}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update job" : "Create job"}
            </Button>
          </div>
        </form>
      )}
    </HrLayout>
  );
}
