import { useEffect, useMemo, useState, type FormEvent } from "react";
import { format, isToday, parseISO } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Link2,
  List,
  Plus,
  RotateCcw,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { hrService, type HRApplication, type HRInterview } from "@/services/hrService";

type InterviewTab = "upcoming" | "completed" | "cancelled" | "all";
type ViewMode = "list" | "calendar";

type ScheduleForm = {
  application_id: string;
  interviewer_name: string;
  panel: string;
  interview_type: string;
  scheduled_at: string;
  duration: string;
  meeting_link: string;
  notes: string;
};

const defaultScheduleForm: ScheduleForm = {
  application_id: "",
  interviewer_name: "",
  panel: "",
  interview_type: "Technical",
  scheduled_at: "",
  duration: "45",
  meeting_link: "",
  notes: "",
};

const statusClasses: Record<string, string> = {
  scheduled: "bg-primary-soft text-primary border-transparent",
  completed: "bg-secondary-soft text-secondary border-transparent",
  cancelled: "bg-destructive/10 text-destructive border-transparent",
  no_show: "bg-accent-soft text-accent-foreground border-transparent",
};

export function HrInterviewsPage() {
  const [interviews, setInterviews] = useState<HRInterview[]>([]);
  const [applications, setApplications] = useState<HRApplication[]>([]);
  const [tab, setTab] = useState<InterviewTab>("upcoming");
  const [view, setView] = useState<ViewMode>("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(defaultScheduleForm);
  const [completeTarget, setCompleteTarget] = useState<HRInterview | null>(null);
  const [cancelTarget, setCancelTarget] = useState<HRInterview | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<HRInterview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HRInterview | null>(null);
  const [completeForm, setCompleteForm] = useState({
    feedback: "",
    rating: "5",
    result: "passed",
  });
  const [cancelNotes, setCancelNotes] = useState("");
  const [rescheduleAt, setRescheduleAt] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [ivRes, appRes] = await Promise.all([
        hrService.listInterviews({ per_page: 200 }),
        hrService.listApplications({ per_page: 200 }),
      ]);
      setInterviews(ivRes.data.data ?? []);
      setApplications(appRes.data.data ?? []);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load interviews");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const sorted = [...interviews].sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    );

    if (tab === "upcoming") {
      return sorted.filter((interview) => {
        const scheduledAt = new Date(interview.scheduled_at);
        return interview.status === "scheduled" && scheduledAt >= now;
      });
    }

    if (tab === "completed") {
      return sorted.filter((interview) => interview.status === "completed");
    }

    if (tab === "cancelled") {
      return sorted.filter(
        (interview) => interview.status === "cancelled" || interview.status === "no_show",
      );
    }

    return sorted;
  }, [interviews, tab]);

  const calendarGroups = useMemo(() => {
    return filtered.reduce<Record<string, HRInterview[]>>((groups, interview) => {
      const key = safeDateKey(interview.scheduled_at);
      groups[key] = [...(groups[key] ?? []), interview];
      return groups;
    }, {});
  }, [filtered]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.application_id || !form.scheduled_at) return;

    setSaving(true);
    try {
      await hrService.createInterview({
        application_id: Number(form.application_id),
        interviewer_name: clean(form.interviewer_name),
        panel: splitList(form.panel),
        interview_type: clean(form.interview_type),
        meeting_link: clean(form.meeting_link),
        scheduled_at: toIsoDateTime(form.scheduled_at),
        duration: Number(form.duration) || 45,
        notes: clean(form.notes),
      });
      setShowForm(false);
      setForm(defaultScheduleForm);
      toast.success("Interview scheduled");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not schedule interview"));
    } finally {
      setSaving(false);
    }
  };

  const submitComplete = async () => {
    if (!completeTarget) return;
    setActionSaving(true);
    try {
      await hrService.completeInterview(completeTarget.id, {
        feedback: clean(completeForm.feedback),
        rating: Number(completeForm.rating),
        result: completeForm.result,
      });
      setCompleteTarget(null);
      toast.success("Interview marked complete");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not complete interview"));
    } finally {
      setActionSaving(false);
    }
  };

  const submitCancel = async () => {
    if (!cancelTarget) return;
    setActionSaving(true);
    try {
      await hrService.cancelInterview(cancelTarget.id, clean(cancelNotes));
      setCancelTarget(null);
      setCancelNotes("");
      toast.success("Interview cancelled");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not cancel interview"));
    } finally {
      setActionSaving(false);
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget || !rescheduleAt) return;
    setActionSaving(true);
    try {
      await hrService.rescheduleInterview(rescheduleTarget.id, toIsoDateTime(rescheduleAt));
      setRescheduleTarget(null);
      setRescheduleAt("");
      toast.success("Interview rescheduled");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not reschedule interview"));
    } finally {
      setActionSaving(false);
    }
  };

  const deleteInterview = async () => {
    if (!deleteTarget) return;
    setActionSaving(true);
    try {
      await hrService.deleteInterview(deleteTarget.id);
      toast.success("Interview deleted");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not delete interview"));
    } finally {
      setActionSaving(false);
    }
  };

  const openCompleteDialog = (interview: HRInterview) => {
    setCompleteForm({
      feedback: interview.feedback ?? "",
      rating: String(interview.rating ?? 5),
      result: interview.result ?? "passed",
    });
    setCompleteTarget(interview);
  };

  const openRescheduleDialog = (interview: HRInterview) => {
    setRescheduleAt(toLocalInputValue(interview.scheduled_at));
    setRescheduleTarget(interview);
  };

  return (
    <HrLayout
      title="Interviews"
      subtitle="Schedule, track and capture interview feedback"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={view === "list" ? "soft" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" /> List
          </Button>
          <Button
            variant={view === "calendar" ? "soft" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="h-4 w-4" /> Calendar
          </Button>
          <Button variant="brand" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Schedule
          </Button>
        </div>
      }
    >
      {error && <HrErrorState message={error} onRetry={load} />}

      {showForm && (
        <form
          onSubmit={create}
          className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Application</Label>
              <Select
                value={form.application_id}
                onValueChange={(v) => setForm((f) => ({ ...f, application_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select candidate application" />
                </SelectTrigger>
                <SelectContent>
                  {applications.map((application) => (
                    <SelectItem key={application.id} value={String(application.id)}>
                      {application.candidate?.name ?? "Candidate"} -{" "}
                      {application.job?.title ?? "Untitled job"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field
              label="Interviewer"
              value={form.interviewer_name}
              onChange={(value) => setForm((f) => ({ ...f, interviewer_name: value }))}
              placeholder="Primary interviewer"
            />
            <Field
              label="Panel"
              value={form.panel}
              onChange={(value) => setForm((f) => ({ ...f, panel: value }))}
              placeholder="Alice, Bob, Carol"
            />
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.interview_type}
                onValueChange={(v) => setForm((f) => ({ ...f, interview_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Screening">Screening</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Panel">Panel</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field
              label="Date and time"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(value) => setForm((f) => ({ ...f, scheduled_at: value }))}
              required
            />
            <Field
              label="Duration (minutes)"
              type="number"
              min="1"
              value={form.duration}
              onChange={(value) => setForm((f) => ({ ...f, duration: value }))}
            />
            <Field
              label="Meeting link"
              value={form.meeting_link}
              onChange={(value) => setForm((f) => ({ ...f, meeting_link: value }))}
              placeholder="https://meet.google.com/..."
            />
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Preparation notes, agenda, or candidate context"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="brand"
              disabled={saving || !form.application_id || !form.scheduled_at}
            >
              {saving ? "Scheduling..." : "Schedule interview"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value as InterviewTab)} className="mt-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <HrLoadingSkeleton rows={4} />
          ) : filtered.length === 0 ? (
            <HrEmptyState
              title="No interviews in this view"
              description="Schedule a new interview or switch filters to see more results."
              action={
                <Button variant="brand" size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" /> Schedule interview
                </Button>
              }
            />
          ) : view === "calendar" ? (
            <div className="space-y-4">
              {Object.entries(calendarGroups).map(([dateKey, dayInterviews]) => (
                <section
                  key={dateKey}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold">
                        {formatCalendarDate(dateKey)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {dayInterviews.length} interview{dayInterviews.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    {isToday(parseISO(dateKey)) && <Badge variant="secondary">Today</Badge>}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {dayInterviews.map((interview) => (
                      <InterviewCard
                        key={interview.id}
                        interview={interview}
                        compact
                        onComplete={openCompleteDialog}
                        onCancel={(target) => {
                          setCancelNotes("");
                          setCancelTarget(target);
                        }}
                        onReschedule={openRescheduleDialog}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {filtered.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  onComplete={openCompleteDialog}
                  onCancel={(target) => {
                    setCancelNotes("");
                    setCancelTarget(target);
                  }}
                  onReschedule={openRescheduleDialog}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!completeTarget} onOpenChange={(open) => !open && setCompleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete interview</DialogTitle>
            <DialogDescription>
              Capture feedback, rating, and the interview result.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                rows={4}
                value={completeForm.feedback}
                onChange={(e) => setCompleteForm((f) => ({ ...f, feedback: e.target.value }))}
                placeholder="Candidate strengths, concerns, and next steps"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rating</Label>
                <Select
                  value={completeForm.rating}
                  onValueChange={(value) => setCompleteForm((f) => ({ ...f, rating: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <SelectItem key={rating} value={String(rating)}>
                        {rating}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Result</Label>
                <Select
                  value={completeForm.result}
                  onValueChange={(value) => setCompleteForm((f) => ({ ...f, result: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="next_round">Next round</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTarget(null)}>
              Close
            </Button>
            <Button variant="brand" onClick={submitComplete} disabled={actionSaving}>
              {actionSaving ? "Saving..." : "Complete interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel interview</DialogTitle>
            <DialogDescription>
              Confirm cancellation and add optional notes for your hiring team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Cancellation notes</Label>
            <Textarea
              rows={4}
              value={cancelNotes}
              onChange={(e) => setCancelNotes(e.target.value)}
              placeholder="Reason, rescheduling context, or candidate communication"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep interview
            </Button>
            <Button variant="destructive" onClick={submitCancel} disabled={actionSaving}>
              {actionSaving ? "Cancelling..." : "Cancel interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rescheduleTarget} onOpenChange={(open) => !open && setRescheduleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule interview</DialogTitle>
            <DialogDescription>Choose the new date and time for this interview.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New date and time</Label>
            <Input
              type="datetime-local"
              value={rescheduleAt}
              onChange={(e) => setRescheduleAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>
              Close
            </Button>
            <Button
              variant="brand"
              onClick={submitReschedule}
              disabled={actionSaving || !rescheduleAt}
            >
              {actionSaving ? "Saving..." : "Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HrConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete interview?"
        description="This interview will be permanently removed from the schedule."
        confirmLabel={actionSaving ? "Deleting..." : "Delete"}
        destructive
        onConfirm={deleteInterview}
      />
    </HrLayout>
  );
}

function InterviewCard({
  interview,
  compact,
  onComplete,
  onCancel,
  onReschedule,
  onDelete,
}: {
  interview: HRInterview;
  compact?: boolean;
  onComplete: (interview: HRInterview) => void;
  onCancel: (interview: HRInterview) => void;
  onReschedule: (interview: HRInterview) => void;
  onDelete: (interview: HRInterview) => void;
}) {
  const canChange = interview.status === "scheduled";
  const scheduledLabel = formatDateTime(interview.scheduled_at);

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{interview.candidate?.name ?? "Candidate"}</p>
          <p className="text-sm text-muted-foreground">{interview.job?.title ?? "Untitled job"}</p>
        </div>
        <Badge className={cn("capitalize", statusClasses[interview.status])}>
          {interview.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {scheduledLabel} - {interview.duration} min
        </p>
        <p>
          {interview.interview_type ?? "Interview"} with{" "}
          {interview.interviewer_name || "Interviewer TBD"}
        </p>
        {interview.panel?.length ? <p>Panel: {interview.panel.join(", ")}</p> : null}
        {interview.meeting_link && (
          <a
            href={interview.meeting_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Link2 className="h-3.5 w-3.5" /> Meeting link
          </a>
        )}
        {!compact && interview.notes && <p className="text-foreground">Notes: {interview.notes}</p>}
        {!compact && interview.feedback && (
          <p className="text-foreground">Feedback: {interview.feedback}</p>
        )}
        {!compact && interview.result && (
          <p className="text-foreground">
            Result: {interview.result}
            {interview.rating ? ` - ${interview.rating}/5` : ""}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canChange && (
          <>
            <Button size="sm" variant="brand" onClick={() => onComplete(interview)}>
              <CheckCircle2 className="h-4 w-4" /> Complete
            </Button>
            <Button size="sm" variant="outline" onClick={() => onReschedule(interview)}>
              <RotateCcw className="h-4 w-4" /> Reschedule
            </Button>
            <Button size="sm" variant="outline" onClick={() => onCancel(interview)}>
              <XCircle className="h-4 w-4" /> Cancel
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={() => onDelete(interview)}>
          <Trash2 className="h-4 w-4 text-destructive" /> Delete
        </Button>
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  min,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}

function clean(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

function safeDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return format(date, "yyyy-MM-dd");
}

function formatCalendarDate(dateKey: string) {
  if (dateKey === "Invalid date") return dateKey;
  return format(parseISO(dateKey), "EEEE, MMM d, yyyy");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return format(date, "MMM d, yyyy h:mm a");
}

function toLocalInputValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
