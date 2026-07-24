import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarClock,
  ExternalLink,
  FileText,
  MessageSquareText,
  Search,
  Star,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  hrService,
  stageLabel,
  type HRApplication,
  type HRJob,
} from "@/services/hrService";
import { cn } from "@/lib/utils";

type ApplicationFilters = {
  search: string;
  stage: string;
  jobId: string;
  source: string;
  offerStatus: string;
  rating: string;
  from: string;
  to: string;
  sort: string;
};

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
};

type RejectState = {
  ids: number[];
  label: string;
};

const DEFAULT_FILTERS: ApplicationFilters = {
  search: "",
  stage: "all",
  jobId: "all",
  source: "",
  offerStatus: "all",
  rating: "all",
  from: "",
  to: "",
  sort: "latest",
};

const OFFER_STATUSES = ["none", "pending", "accepted", "declined"];

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString();
}

function formatMoney(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "Not provided";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function stageBadgeClass(stage: string) {
  switch (stage) {
    case "rejected":
      return "border-destructive/20 bg-destructive/10 text-destructive";
    case "joined":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "offer":
      return "border-accent/20 bg-accent/10 text-accent-foreground";
    default:
      return "border-primary/20 bg-primary-soft text-primary";
  }
}

function RatingStars({
  rating,
  onRate,
  disabled,
}: {
  rating?: number | null;
  onRate?: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating ?? 0} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (rating ?? 0) >= n;
        const star = (
          <Star
            className={cn(
              "h-4 w-4",
              active ? "fill-accent text-accent" : "text-muted-foreground/50",
            )}
          />
        );

        if (!onRate) {
          return <span key={n}>{star}</span>;
        }

        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onRate(n)}
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Set rating to ${n}`}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}

export function HrApplicationsPage() {
  const [applications, setApplications] = useState<HRApplication[]>([]);
  const [jobs, setJobs] = useState<HRJob[]>([]);
  const [draftFilters, setDraftFilters] = useState<ApplicationFilters>(DEFAULT_FILTERS);
  const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStage, setBulkStage] = useState<string>("screening");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingAction, setSavingAction] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [rejectState, setRejectState] = useState<RejectState | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [notesApp, setNotesApp] = useState<HRApplication | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<HRApplication | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const allSelected = applications.length > 0 && selectedIds.length === applications.length;
  const selectedCount = selectedIds.length;

  const selectedLabel = useMemo(() => {
    if (selectedCount === 1) return "1 selected application";
    return `${selectedCount} selected applications`;
  }, [selectedCount]);

  const loadJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res = await hrService.listJobs({ per_page: 100, sort: "title" });
      setJobs(res.data.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load jobs for filtering"));
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.listApplications({
        page,
        per_page: 15,
        search: filters.search || undefined,
        stage: filters.stage === "all" ? undefined : filters.stage,
        job_id: filters.jobId === "all" ? undefined : filters.jobId,
        source: filters.source.trim() || undefined,
        offer_status: filters.offerStatus === "all" ? undefined : filters.offerStatus,
        rating: filters.rating === "all" ? undefined : filters.rating,
        from: filters.from || undefined,
        to: filters.to || undefined,
        sort: filters.sort,
      });
      const nextApplications = res.data.data;
      setApplications(nextApplications);
      setLastPage(res.data.last_page || 1);
      setTotal(res.data.total || 0);
      setSelectedIds((current) =>
        current.filter((id) => nextApplications.some((application) => application.id === id)),
      );
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load applications"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications, refreshKey]);

  const reload = () => setRefreshKey((key) => key + 1);

  const updateDraftFilter = (key: keyof ApplicationFilters, value: string) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setSelectedIds([]);
    setPage(1);
    setFilters({
      ...draftFilters,
      search: draftFilters.search.trim(),
      source: draftFilters.source.trim(),
    });
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
      current.length === applications.length
        ? []
        : applications.map((application) => application.id),
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

  const updateRating = (application: HRApplication, rating: number) => {
    void runAction(
      `rating-${application.id}`,
      () => hrService.updateApplication(application.id, { rating }),
      "Rating updated",
    );
  };

  const moveApplication = (application: HRApplication, nextStage: string) => {
    if (nextStage === application.current_stage) return;
    if (nextStage === "rejected") {
      setRejectReason(application.rejected_reason ?? "");
      setRejectState({
        ids: [application.id],
        label: application.candidate?.name ?? `application #${application.id}`,
      });
      return;
    }

    void runAction(
      `move-${application.id}`,
      () => hrService.updateApplication(application.id, { current_stage: nextStage }),
      `Moved to ${stageLabel(nextStage)}`,
    );
  };

  const shortlistApplication = (application: HRApplication) => {
    void runAction(
      `shortlist-${application.id}`,
      () => hrService.shortlistApplication(application.id),
      "Application shortlisted",
    );
  };

  const openRejectDialog = (application: HRApplication) => {
    setRejectReason(application.rejected_reason ?? "");
    setRejectState({
      ids: [application.id],
      label: application.candidate?.name ?? `application #${application.id}`,
    });
  };

  const submitReject = async () => {
    if (!rejectState) return;
    const ids = rejectState.ids;
    const reason = rejectReason.trim();
    const success = await runAction(
      `reject-${ids.join("-")}`,
      async () => {
        if (ids.length === 1) {
          await hrService.rejectApplication(ids[0], reason);
          return;
        }
        await hrService.bulkUpdateApplications({
          ids,
          action: "reject",
          rejected_reason: reason,
        });
      },
      ids.length === 1 ? "Application rejected" : "Applications rejected",
    );
    if (!success) return;
    setRejectState(null);
    setRejectReason("");
    setSelectedIds([]);
  };

  const bulkShortlist = () => {
    if (!selectedIds.length) return;
    setConfirmState({
      title: "Shortlist selected applications?",
      description: `Move ${selectedLabel} to ${stageLabel("screening")}.`,
      confirmLabel: "Shortlist",
      onConfirm: async () => {
        const success = await runAction(
          "bulk-shortlist",
          () => hrService.bulkUpdateApplications({ ids: selectedIds, action: "shortlist" }),
          "Selected applications shortlisted",
        );
        if (success) setSelectedIds([]);
      },
    });
  };

  const bulkMove = () => {
    if (!selectedIds.length) return;
    if (bulkStage === "rejected") {
      setRejectReason("");
      setRejectState({ ids: selectedIds, label: selectedLabel });
      return;
    }

    setConfirmState({
      title: "Move selected applications?",
      description: `Move ${selectedLabel} to ${stageLabel(bulkStage)}.`,
      confirmLabel: "Move",
      onConfirm: async () => {
        const success = await runAction(
          "bulk-move",
          () =>
            hrService.bulkUpdateApplications({
              ids: selectedIds,
              action: "move",
              current_stage: bulkStage,
            }),
          `Selected applications moved to ${stageLabel(bulkStage)}`,
        );
        if (success) setSelectedIds([]);
      },
    });
  };

  const bulkReject = () => {
    if (!selectedIds.length) return;
    setRejectReason("");
    setRejectState({ ids: selectedIds, label: selectedLabel });
  };

  const openNotes = (application: HRApplication) => {
    setNotesApp(application);
    setNotesValue(application.hr_notes ?? "");
  };

  const saveNotes = async () => {
    if (!notesApp) return;
    const success = await runAction(
      `notes-${notesApp.id}`,
      () => hrService.updateApplication(notesApp.id, { hr_notes: notesValue }),
      "Notes saved",
    );
    if (!success) return;
    setNotesApp(null);
    setNotesValue("");
  };

  const openTimeline = async (application: HRApplication) => {
    setDetailOpen(true);
    setDetail(application);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await hrService.getApplication(application.id);
      setDetail(res.data);
    } catch (err) {
      setDetailError(apiErrorMessage(err, "Failed to load application timeline"));
    } finally {
      setDetailLoading(false);
    }
  };

  const retry = () => {
    void loadJobs();
    void loadApplications();
  };

  return (
    <HrLayout title="Applications" subtitle="Review candidates and manage your ATS pipeline">
      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-border bg-card p-4 shadow-card"
      >
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search candidate name or email"
              value={draftFilters.search}
              onChange={(event) => updateDraftFilter("search", event.target.value)}
            />
          </div>

          <Select
            value={draftFilters.stage}
            onValueChange={(value) => updateDraftFilter("stage", value)}
          >
            <SelectTrigger className="lg:col-span-2">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {PIPELINE_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_LABELS[stage] ?? stageLabel(stage)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={draftFilters.jobId}
            onValueChange={(value) => updateDraftFilter("jobId", value)}
          >
            <SelectTrigger className="lg:col-span-2">
              <SelectValue placeholder={jobsLoading ? "Loading jobs" : "Job"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={String(job.id)}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            className="lg:col-span-2"
            placeholder="Source"
            value={draftFilters.source}
            onChange={(event) => updateDraftFilter("source", event.target.value)}
          />

          <Select
            value={draftFilters.offerStatus}
            onValueChange={(value) => updateDraftFilter("offerStatus", value)}
          >
            <SelectTrigger className="lg:col-span-2">
              <SelectValue placeholder="Offer status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All offers</SelectItem>
              {OFFER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {stageLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={draftFilters.rating}
            onValueChange={(value) => updateDraftFilter("rating", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any rating</SelectItem>
              {[5, 4, 3, 2, 1].map((rating) => (
                <SelectItem key={rating} value={String(rating)}>
                  {rating}+ stars
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <Input
            className="lg:col-span-2"
            type="date"
            aria-label="Applied from date"
            value={draftFilters.from}
            onChange={(event) => updateDraftFilter("from", event.target.value)}
          />
          <Input
            className="lg:col-span-2"
            type="date"
            aria-label="Applied to date"
            value={draftFilters.to}
            onChange={(event) => updateDraftFilter("to", event.target.value)}
          />
          <Select
            value={draftFilters.sort}
            onValueChange={(value) => updateDraftFilter("sort", value)}
          >
            <SelectTrigger className="lg:col-span-2">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="rating">Highest rating</SelectItem>
              <SelectItem value="stage">Stage</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 lg:col-span-6 lg:justify-end">
            <Button type="submit" variant="brand">
              Apply filters
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </form>

      {selectedCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
          <p className="text-sm font-semibold">{selectedLabel}</p>
          <Button
            size="sm"
            variant="soft"
            disabled={savingAction === "bulk-shortlist"}
            onClick={bulkShortlist}
          >
            Bulk shortlist
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={savingAction === "bulk-reject"}
            onClick={bulkReject}
          >
            Bulk reject
          </Button>
          <Select value={bulkStage} onValueChange={setBulkStage}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Move stage" />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stageLabel(stage)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            disabled={savingAction === "bulk-move"}
            onClick={bulkMove}
          >
            Move selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
            Clear selection
          </Button>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <HrLoadingSkeleton rows={6} />
        ) : error ? (
          <HrErrorState message={error} onRetry={retry} />
        ) : applications.length === 0 ? (
          <HrEmptyState
            title="No applications found"
            description="Adjust filters or wait for candidates to apply to your jobs."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <Table className="min-w-[1300px]">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-12 px-4">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all applications"
                    />
                  </TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Expected salary</TableHead>
                  <TableHead>Applied date</TableHead>
                  <TableHead>Interview status</TableHead>
                  <TableHead>Offer status</TableHead>
                  <TableHead className="w-[360px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow
                    key={application.id}
                    data-state={selectedIds.includes(application.id) ? "selected" : undefined}
                  >
                    <TableCell className="px-4">
                      <Checkbox
                        checked={selectedIds.includes(application.id)}
                        onCheckedChange={() => toggleSelected(application.id)}
                        aria-label={`Select ${application.candidate?.name ?? "application"}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {application.candidate?.name ?? "Candidate unavailable"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {application.candidate?.email ?? "Email not provided"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{application.job?.title ?? "Job unavailable"}</p>
                        <p className="text-xs text-muted-foreground">
                          {application.job?.department ?? "No department"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "whitespace-nowrap",
                          stageBadgeClass(application.current_stage),
                        )}
                      >
                        {application.stage_label ?? stageLabel(application.current_stage)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <RatingStars
                        rating={application.rating}
                        disabled={savingAction === `rating-${application.id}`}
                        onRate={(rating) => updateRating(application, rating)}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {application.source || "Not provided"}
                    </TableCell>
                    <TableCell>{formatMoney(application.expected_salary)}</TableCell>
                    <TableCell>
                      {formatDate(application.applied_at ?? application.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {application.interview_status ?? "Not scheduled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {application.offer_status ?? "none"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            to="/hr/candidates/$id"
                            params={{ id: String(application.candidate_id) }}
                          >
                            Profile
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="soft"
                          disabled={savingAction === `shortlist-${application.id}`}
                          onClick={() => shortlistApplication(application)}
                        >
                          Shortlist
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(application)}
                        >
                          Reject
                        </Button>
                        <Select
                          value={application.current_stage}
                          disabled={savingAction === `move-${application.id}`}
                          onValueChange={(value) => moveApplication(application, value)}
                        >
                          <SelectTrigger className="h-9 w-40 text-xs">
                            <SelectValue placeholder="Move stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE_STAGES.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {stageLabel(stage)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!application.resume_url}
                          onClick={() =>
                            application.resume_url &&
                            window.open(application.resume_url, "_blank", "noopener,noreferrer")
                          }
                        >
                          <FileText className="h-4 w-4" />
                          Resume
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openNotes(application)}>
                          <MessageSquareText className="h-4 w-4" />
                          Notes
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void openTimeline(application)}
                        >
                          <CalendarClock className="h-4 w-4" />
                          Timeline
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {lastPage} · {total} total applications
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={!!rejectState} onOpenChange={(open) => !open && setRejectState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Add a rejection reason for {rejectState?.label}. This will move the application to{" "}
              {stageLabel("rejected")}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            placeholder="Reason for rejection"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectState(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || !!savingAction?.startsWith("reject-")}
              onClick={() => void submitReject()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!notesApp} onOpenChange={(open) => !open && setNotesApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application notes</DialogTitle>
            <DialogDescription>
              Update internal HR notes for {notesApp?.candidate?.name ?? "this application"}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={7}
            placeholder="Add internal HR notes"
            value={notesValue}
            onChange={(event) => setNotesValue(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesApp(null)}>
              Cancel
            </Button>
            <Button
              variant="brand"
              disabled={savingAction === `notes-${notesApp?.id}`}
              onClick={() => void saveNotes()}
            >
              Save notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{detail?.candidate?.name ?? "Application timeline"}</SheetTitle>
            <SheetDescription>
              {detail?.job?.title ?? "Hiring activity for this application"}
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <HrLoadingSkeleton rows={4} className="mt-6" />
          ) : detailError ? (
            <div className="mt-6">
              <HrErrorState
                message={detailError}
                onRetry={() => detail && void openTimeline(detail)}
              />
            </div>
          ) : detail ? (
            <div className="mt-6 space-y-6">
              <section className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={stageBadgeClass(detail.current_stage)}>
                    {detail.stage_label ?? stageLabel(detail.current_stage)}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    Offer: {detail.offer_status ?? "none"}
                  </Badge>
                  <RatingStars rating={detail.rating} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Applied</dt>
                    <dd className="font-medium">
                      {formatDateTime(detail.applied_at ?? detail.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Expected salary</dt>
                    <dd className="font-medium">{formatMoney(detail.expected_salary)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Source</dt>
                    <dd className="font-medium">{detail.source || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Interview status</dt>
                    <dd className="font-medium">{detail.interview_status ?? "Not scheduled"}</dd>
                  </div>
                </dl>
                {detail.resume_url && (
                  <Button
                    className="mt-4"
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(detail.resume_url!, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open resume
                  </Button>
                )}
              </section>

              <section>
                <h3 className="font-semibold">Timeline</h3>
                <div className="mt-3 space-y-3">
                  {(detail.timeline ?? []).length === 0 ? (
                    <HrEmptyState
                      title="No timeline yet"
                      description="Timeline events will appear as this application moves through stages."
                    />
                  ) : (
                    detail.timeline!.map((event) => (
                      <div key={event.id} className="rounded-xl border border-border p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{stageLabel(event.event)}</p>
                          {event.to_stage && (
                            <Badge variant="outline" className={stageBadgeClass(event.to_stage)}>
                              {stageLabel(event.to_stage)}
                            </Badge>
                          )}
                        </div>
                        {event.description && (
                          <p className="mt-1 text-muted-foreground">{event.description}</p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDateTime(event.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <HrConfirmDialog
        open={!!confirmState}
        onOpenChange={(open) => !open && setConfirmState(null)}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={confirmState?.confirmLabel ?? "Confirm"}
        destructive={confirmState?.destructive}
        onConfirm={() => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          if (action) void action();
        }}
      />
    </HrLayout>
  );
}
