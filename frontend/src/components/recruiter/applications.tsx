import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  MapPin,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
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
  recruiterService,
  type Paginated,
  type RecruiterApplication,
  type RecruiterOpportunity,
} from "@/services/recruiterOpportunityService";

type Candidate = NonNullable<RecruiterApplication["candidate"]> & {
  photo?: string | null;
  resume_url?: string | null;
};

type ApplicationItem = Omit<RecruiterApplication, "candidate" | "opportunity"> & {
  candidate?: Candidate | null;
  opportunity?:
    | (NonNullable<RecruiterApplication["opportunity"]> & {
        company_name?: string | null;
        status?: string | null;
      })
    | null;
  created_at?: string | null;
};

type RejectTarget = { type: "single"; application: ApplicationItem } | { type: "bulk" } | null;

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
] as const;

const perPage = 10;

export function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [opportunities, setOpportunities] = useState<RecruiterOpportunity[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [jobId, setJobId] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [rejectTarget, setRejectTarget] = useState<RejectTarget>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleTarget, setScheduleTarget] = useState<ApplicationItem | null>(null);
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewLink, setInterviewLink] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await recruiterService.listApplications({
        page,
        per_page: perPage,
        search: appliedSearch || undefined,
        status: status === "all" ? undefined : status,
        opportunity_id: jobId === "all" ? undefined : jobId,
      });
      const payload = normalizePaginated<ApplicationItem>(res.data as Paginated<ApplicationItem>);
      setApplications(payload.items);
      setPage(payload.currentPage);
      setLastPage(payload.lastPage);
      setTotal(payload.total);
      setSelected([]);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load applications");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, jobId, page, status]);

  const loadOpportunities = useCallback(async () => {
    try {
      const res = await recruiterService.listOpportunities({ per_page: 100, sort: "latest" });
      setOpportunities(asList<RecruiterOpportunity>(res.data));
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not load job filter options"));
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const allVisibleSelected = useMemo(
    () =>
      applications.length > 0 &&
      applications.every((application) => selected.includes(application.id)),
    [applications, selected],
  );

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const toggleSelected = (id: number, checked: boolean) => {
    setSelected((current) =>
      checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id),
    );
  };

  const toggleAllVisible = (checked: boolean) => {
    setSelected(checked ? applications.map((application) => application.id) : []);
  };

  const shortlistApplication = async (application: ApplicationItem) => {
    setSaving(true);
    try {
      await recruiterService.shortlistApplication(application.id);
      toast.success("Application shortlisted");
      await loadApplications();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not shortlist application"));
    } finally {
      setSaving(false);
    }
  };

  const rejectApplications = async () => {
    if (!rejectTarget) return;

    setSaving(true);
    try {
      if (rejectTarget.type === "single") {
        await recruiterService.rejectApplication(
          rejectTarget.application.id,
          rejectReason.trim() || undefined,
        );
        toast.success("Application rejected");
      } else {
        await recruiterService.bulkApplications({ ids: selected, action: "reject" });
        toast.success("Selected applications rejected");
      }
      setRejectTarget(null);
      setRejectReason("");
      await loadApplications();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not reject application"));
    } finally {
      setSaving(false);
    }
  };

  const hireApplication = async (application: ApplicationItem) => {
    setSaving(true);
    try {
      await recruiterService.hireApplication(application.id);
      toast.success("Candidate marked as hired");
      await loadApplications();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not hire candidate"));
    } finally {
      setSaving(false);
    }
  };

  const bulkShortlist = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one application");
      return;
    }

    setSaving(true);
    try {
      await recruiterService.bulkApplications({ ids: selected, action: "shortlist" });
      toast.success("Selected applications shortlisted");
      await loadApplications();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not shortlist selected applications"));
    } finally {
      setSaving(false);
    }
  };

  const openScheduleDialog = (application: ApplicationItem) => {
    setScheduleTarget(application);
    setInterviewAt(toDateTimeLocal(application.interview_at));
    setInterviewLink(application.interview_link ?? "");
  };

  const scheduleInterview = async (event: FormEvent) => {
    event.preventDefault();
    if (!scheduleTarget) return;
    if (!interviewAt) {
      toast.error("Choose an interview date and time");
      return;
    }

    setSaving(true);
    try {
      await recruiterService.scheduleInterview(scheduleTarget.id, {
        interview_at: new Date(interviewAt).toISOString(),
        interview_link: interviewLink.trim() || undefined,
        interview_status: "scheduled",
      });
      toast.success("Interview scheduled");
      setScheduleTarget(null);
      setInterviewAt("");
      setInterviewLink("");
      await loadApplications();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not schedule interview"));
    } finally {
      setSaving(false);
    }
  };

  const rateApplication = async (application: ApplicationItem, rating: number) => {
    setSaving(true);
    try {
      await recruiterService.updateApplication(application.id, { rating });
      toast.success("Rating updated");
      setApplications((current) =>
        current.map((item) => (item.id === application.id ? { ...item, rating } : item)),
      );
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not update rating"));
    } finally {
      setSaving(false);
    }
  };

  const showingFrom = total === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(page * perPage, total);

  return (
    <RecruiterLayout
      title="Applications Received"
      subtitle="Review, shortlist and schedule interviews"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Results"
          value={total}
          icon={Users}
          tint="bg-primary-soft text-primary"
        />
        <SummaryCard
          label="Selected"
          value={selected.length}
          icon={CheckCircle2}
          tint="bg-secondary-soft text-secondary"
        />
        <SummaryCard
          label="Current Page"
          value={applications.length}
          icon={FileText}
          tint="bg-accent-soft text-accent-foreground"
        />
      </section>

      <form
        onSubmit={onSearch}
        className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_240px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by candidate, skill or opportunity..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={jobId}
            onValueChange={(value) => {
              setJobId(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Opportunity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All opportunities</SelectItem>
              {opportunities.map((opportunity) => (
                <SelectItem key={opportunity.id} value={String(opportunity.id)}>
                  {opportunity.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </div>
      </form>

      <div className="mt-4 rounded-2xl border border-border bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Candidate Applications</h3>
            <p className="text-sm text-muted-foreground">
              Showing {showingFrom}-{showingTo} of {total}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={bulkShortlist}
              disabled={saving || selected.length === 0}
            >
              <CheckCircle2 className="h-4 w-4" /> Bulk shortlist
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => {
                if (selected.length === 0) {
                  toast.error("Select at least one application");
                  return;
                }
                setRejectTarget({ type: "bulk" });
              }}
              disabled={saving || selected.length === 0}
            >
              <X className="h-4 w-4" /> Bulk reject
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-4">
            <RecruiterLoadingSkeleton rows={5} />
          </div>
        ) : error ? (
          <div className="p-4">
            <RecruiterErrorState message={error} onRetry={loadApplications} />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-4">
            <RecruiterEmptyState
              title="No applications found"
              description="Try changing filters or check again after candidates apply."
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                        aria-label="Select all applications"
                      />
                    </TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(application.id)}
                          onCheckedChange={(checked) =>
                            toggleSelected(application.id, checked === true)
                          }
                          aria-label={`Select ${candidateName(application)}`}
                        />
                      </TableCell>
                      <TableCell>
                        <CandidateBlock application={application} />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48">
                          <p className="truncate font-medium">
                            {application.opportunity?.title ?? "Opportunity"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {application.opportunity?.location ?? "Location unavailable"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <SkillList skills={application.candidate?.skills} />
                      </TableCell>
                      <TableCell>
                        <ApplicationDetails application={application} />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <StatusPill status={application.status} />
                          <p className="text-xs text-muted-foreground">
                            Interview: {titleCase(application.interview_status || "not scheduled")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RatingStars
                          rating={application.rating}
                          disabled={saving}
                          onRate={(rating) => rateApplication(application, rating)}
                        />
                      </TableCell>
                      <TableCell>
                        <RowActions
                          application={application}
                          saving={saving}
                          onShortlist={() => shortlistApplication(application)}
                          onHire={() => hireApplication(application)}
                          onReject={() => setRejectTarget({ type: "single", application })}
                          onSchedule={() => openScheduleDialog(application)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4 p-4 lg:hidden">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                  aria-label="Select all applications"
                />
                <span className="text-sm text-muted-foreground">Select all on this page</span>
              </div>
              {applications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-2xl border border-border bg-surface p-4 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.includes(application.id)}
                      onCheckedChange={(checked) =>
                        toggleSelected(application.id, checked === true)
                      }
                      aria-label={`Select ${candidateName(application)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <CandidateBlock application={application} />
                        <StatusPill status={application.status} />
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium">
                          {application.opportunity?.title ?? "Opportunity"}
                        </p>
                        <ApplicationDetails application={application} />
                      </div>
                      <div className="mt-3">
                        <SkillList skills={application.candidate?.skills} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Interview: {titleCase(application.interview_status || "not scheduled")}
                        </p>
                        <RatingStars
                          rating={application.rating}
                          disabled={saving}
                          onRate={(rating) => rateApplication(application, rating)}
                        />
                      </div>
                      <RowActions
                        application={application}
                        saving={saving}
                        onShortlist={() => shortlistApplication(application)}
                        onHire={() => hireApplication(application)}
                        onReject={() => setRejectTarget({ type: "single", application })}
                        onSchedule={() => openScheduleDialog(application)}
                        mobile
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            Page {page} of {lastPage}
          </p>
          <div className="flex items-center gap-1">
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
              disabled={page >= lastPage || loading}
              onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!scheduleTarget} onOpenChange={(open) => !open && setScheduleTarget(null)}>
        <DialogContent>
          <form onSubmit={scheduleInterview}>
            <DialogHeader>
              <DialogTitle>Schedule interview</DialogTitle>
              <DialogDescription>
                Set the interview time and optional meeting link for{" "}
                {scheduleTarget ? candidateName(scheduleTarget) : "this candidate"}.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interview_at">Date and time</Label>
                <Input
                  id="interview_at"
                  type="datetime-local"
                  value={interviewAt}
                  onChange={(event) => setInterviewAt(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interview_link">Meeting link</Label>
                <Input
                  id="interview_link"
                  placeholder="https://meet.google.com/..."
                  value={interviewLink}
                  onChange={(event) => setInterviewLink(event.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setScheduleTarget(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" disabled={saving}>
                {saving ? "Scheduling..." : "Schedule interview"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectTarget?.type === "bulk"
                ? "Reject selected applications?"
                : "Reject application?"}
            </DialogTitle>
            <DialogDescription>
              {rejectTarget?.type === "bulk"
                ? `This will reject ${selected.length} selected application${selected.length === 1 ? "" : "s"}.`
                : "Optionally add a reason that will be saved with the rejection."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject_reason">Reason (optional)</Label>
            <Input
              id="reject_reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Experience mismatch"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={() => void rejectApplications()}
            >
              {saving ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RecruiterLayout>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold">{formatNumber(value)}</p>
    </div>
  );
}

function CandidateBlock({ application }: { application: ApplicationItem }) {
  const candidate = application.candidate;
  const name = candidateName(application);
  const photo = candidate?.profile_photo ?? candidate?.photo ?? null;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="h-11 w-11">
        <AvatarImage src={photo ?? undefined} alt="" />
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {candidate?.experience || "Experience unavailable"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {candidate?.location || "Location unavailable"}
        </p>
      </div>
    </div>
  );
}

function ApplicationDetails({ application }: { application: ApplicationItem }) {
  return (
    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
      <p className="inline-flex items-center gap-1">
        <CalendarClock className="h-3.5 w-3.5" /> Applied{" "}
        {formatDate(application.applied_at ?? application.created_at)}
      </p>
      <p className="flex items-center gap-1">
        <MapPin className="h-3.5 w-3.5" />{" "}
        {application.opportunity?.location ??
          application.candidate?.location ??
          "Location unavailable"}
      </p>
      <p>Expected salary: {formatCurrency(application.expected_salary)}</p>
    </div>
  );
}

function SkillList({ skills }: { skills?: string[] | string | null }) {
  const list = Array.isArray(skills)
    ? skills
    : typeof skills === "string"
      ? skills.split(",").map((skill) => skill.trim())
      : [];
  const visible = list.filter(Boolean).slice(0, 4);

  if (visible.length === 0) {
    return <span className="text-xs text-muted-foreground">No skills listed</span>;
  }

  return (
    <div className="flex max-w-64 flex-wrap gap-1.5">
      {visible.map((skill) => (
        <span key={skill} className="rounded-full bg-muted px-2 py-0.5 text-xs">
          {skill}
        </span>
      ))}
      {list.length > visible.length && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          +{list.length - visible.length}
        </span>
      )}
    </div>
  );
}

function RowActions({
  application,
  saving,
  onShortlist,
  onHire,
  onReject,
  onSchedule,
  mobile,
}: {
  application: ApplicationItem;
  saving: boolean;
  onShortlist: () => void;
  onHire: () => void;
  onReject: () => void;
  onSchedule: () => void;
  mobile?: boolean;
}) {
  const resumeUrl = application.resume_url ?? application.candidate?.resume_url ?? null;

  return (
    <div className={mobile ? "mt-4 grid grid-cols-2 gap-2" : "flex flex-wrap justify-end gap-1"}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onShortlist}
        disabled={saving || application.status === "shortlisted" || application.status === "hired"}
      >
        <CheckCircle2 className="h-4 w-4" /> Shortlist
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onSchedule} disabled={saving}>
        <CalendarClock className="h-4 w-4" /> Schedule
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onHire}
        disabled={saving || application.status === "hired"}
      >
        <Users className="h-4 w-4" /> Hire
      </Button>
      {resumeUrl ? (
        <Button asChild variant="outline" size="sm">
          <a href={resumeUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Resume
          </a>
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled>
          <FileText className="h-4 w-4" /> Resume
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:bg-destructive/10"
        onClick={onReject}
        disabled={saving || application.status === "rejected"}
      >
        <X className="h-4 w-4" /> Reject
      </Button>
    </div>
  );
}

function RatingStars({
  rating,
  disabled,
  onRate,
}: {
  rating?: number | null;
  disabled: boolean;
  onRate: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          className="rounded p-0.5 text-muted-foreground hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => onRate(value)}
          disabled={disabled}
          aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
        >
          <Star
            className={`h-4 w-4 ${Number(rating ?? 0) >= value ? "fill-accent text-accent" : ""}`}
          />
        </button>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-primary-soft text-primary",
    shortlisted: "bg-secondary-soft text-secondary",
    interview: "bg-accent-soft text-accent-foreground",
    rejected: "bg-destructive/10 text-destructive",
    hired: "bg-secondary-soft text-secondary",
  };
  const normalized = status.toLowerCase();

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        map[normalized] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {titleCase(status)}
    </span>
  );
}

function normalizePaginated<T>(input: Paginated<T>) {
  return {
    items: input?.data ?? [],
    currentPage: input?.current_page ?? 1,
    lastPage: input?.last_page ?? 1,
    total: input?.total ?? input?.data?.length ?? 0,
  };
}

function candidateName(application: ApplicationItem) {
  return application.candidate?.name ?? "Candidate";
}

function formatNumber(value?: number | string | null) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "0";
  return new Intl.NumberFormat("en-IN").format(number);
}

function formatCurrency(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "Not provided";
  const number = Number(value);
  if (!Number.isFinite(number)) return "Not provided";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(value?: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
