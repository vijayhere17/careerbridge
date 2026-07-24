import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness, CalendarClock, FileText, GripVertical, Star } from "lucide-react";
import { toast } from "sonner";
import { HrLayout } from "@/components/hr/HrLayout";
import {
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  hrService,
  stageLabel,
  type HRJob,
} from "@/services/hrService";
import { cn } from "@/lib/utils";

type PipelineApplication = {
  id: number;
  current_stage: string;
  stage_label?: string;
  rating?: number | null;
  source?: string | null;
  expected_salary?: number | string | null;
  resume_url?: string | null;
  applied_at?: string | null;
  stage_changed_at?: string | null;
  rejected_reason?: string | null;
  offer_status?: string | null;
  updated_at?: string | null;
  candidate?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
    mobile?: string | null;
    location?: string | null;
    profile_photo?: string | null;
    experience?: string | null;
    education?: string | null;
    skills?: unknown[] | null;
    tags?: unknown[] | null;
  } | null;
  job?: {
    id?: number | null;
    title?: string | null;
    department?: string | null;
    location?: string | null;
    status?: string | null;
  } | null;
  latest_interview?: {
    id: number;
    scheduled_at?: string | null;
    status?: string | null;
    rating?: number | null;
    result?: string | null;
  } | null;
};

type PipelineColumn = {
  stage: string;
  label?: string;
  count: number;
  applications: PipelineApplication[];
};

type PendingMove = {
  applicationId: number;
  toStage: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString();
}

function formatMoney(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function avatarInitials(name?: string | null) {
  return (name || "C")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function stageColumnClass(stage: string) {
  switch (stage) {
    case "rejected":
      return "border-destructive/30 bg-destructive/5";
    case "joined":
      return "border-emerald-500/30 bg-emerald-500/5";
    case "offer":
      return "border-accent/30 bg-accent/5";
    default:
      return "border-border bg-muted/20";
  }
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

function RatingStars({ rating }: { rating?: number | null }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating ?? 0} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-3.5 w-3.5",
            (rating ?? 0) >= n ? "fill-accent text-accent" : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

export function HrPipelinePage() {
  const [columns, setColumns] = useState<Record<string, PipelineColumn>>({});
  const [jobs, setJobs] = useState<HRJob[]>([]);
  const [jobId, setJobId] = useState("all");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [rejectedReason, setRejectedReason] = useState("");

  const selectedJob = useMemo(() => jobs.find((job) => String(job.id) === jobId), [jobId, jobs]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.pipeline(jobId === "all" ? undefined : Number(jobId));
      setColumns(res.data.columns ?? {});
      setJobs(res.data.jobs ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load hiring pipeline"));
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const moveApplication = async (applicationId: number, toStage: string, reason?: string) => {
    setMovingId(applicationId);
    try {
      const res = await hrService.movePipeline(applicationId, toStage, reason);
      toast.success(res.message ?? `Moved to ${stageLabel(toStage)}`);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not move application"));
      await load();
    } finally {
      setMovingId(null);
      setDraggingId(null);
      setDragOverStage(null);
    }
  };

  const handleDragStart = (event: DragEvent<HTMLElement>, application: PipelineApplication) => {
    setDraggingId(application.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(application.id));
  };

  const handleDrop = (event: DragEvent<HTMLElement>, toStage: string) => {
    event.preventDefault();
    const applicationId = Number(event.dataTransfer.getData("text/plain") || draggingId);
    setDragOverStage(null);

    if (!applicationId) return;

    const currentApplication = Object.values(columns)
      .flatMap((column) => column.applications)
      .find((application) => application.id === applicationId);

    if (currentApplication?.current_stage === toStage) {
      setDraggingId(null);
      return;
    }

    if (toStage === "rejected") {
      setPendingMove({ applicationId, toStage });
      setRejectedReason(currentApplication?.rejected_reason ?? "");
      return;
    }

    void moveApplication(applicationId, toStage);
  };

  const confirmRejectedMove = async () => {
    if (!pendingMove) return;
    const reason = rejectedReason.trim();
    if (!reason) {
      toast.error("Rejection reason is required");
      return;
    }
    setPendingMove(null);
    setRejectedReason("");
    await moveApplication(pendingMove.applicationId, pendingMove.toStage, reason);
  };

  const renderColumnContent = (stage: string, applications: PipelineApplication[]) => {
    if (loading) {
      return <HrLoadingSkeleton rows={3} />;
    }

    if (error) {
      return (
        <div className="p-1">
          <HrErrorState message={error} onRetry={() => void load()} />
        </div>
      );
    }

    if (applications.length === 0) {
      return (
        <HrEmptyState
          title="No applications"
          description={`No candidates are currently in ${stageLabel(stage)}.`}
        />
      );
    }

    return applications.map((application) => (
      <div
        key={application.id}
        draggable={movingId !== application.id}
        onDragStart={(event) => handleDragStart(event, application)}
        onDragEnd={() => {
          setDraggingId(null);
          setDragOverStage(null);
        }}
        className={cn(
          "cursor-grab rounded-xl border border-border bg-card p-3 shadow-card transition active:cursor-grabbing",
          draggingId === application.id && "opacity-60",
          movingId === application.id && "pointer-events-none opacity-60",
        )}
      >
        <div className="flex items-start gap-3">
          <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          {application.candidate?.profile_photo ? (
            <img
              src={application.candidate.profile_photo}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
              {avatarInitials(application.candidate?.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {application.candidate?.name ?? "Candidate unavailable"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {application.candidate?.email ?? "Email not provided"}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            <span className="truncate">{application.job?.title ?? "Job unavailable"}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5" />
            <span>Applied {formatDate(application.applied_at)}</span>
          </div>
          {application.latest_interview && (
            <Badge variant="outline" className="w-fit capitalize">
              Interview: {application.latest_interview.status ?? "scheduled"}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RatingStars rating={application.rating} />
          {application.source && (
            <Badge variant="outline" className="bg-muted/50">
              {application.source}
            </Badge>
          )}
          {application.expected_salary && (
            <Badge variant="outline" className="bg-muted/50">
              {formatMoney(application.expected_salary)}
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          {application.candidate?.id ? (
            <Button asChild size="sm" variant="outline" className="h-8 px-2 text-xs">
              <Link to="/hr/candidates/$id" params={{ id: String(application.candidate.id) }}>
                Candidate
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {application.resume_url && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => window.open(application.resume_url!, "_blank", "noopener,noreferrer")}
            >
              <FileText className="h-3.5 w-3.5" />
              Resume
            </Button>
          )}
        </div>
      </div>
    ));
  };

  return (
    <HrLayout
      title="Hiring Pipeline"
      subtitle={
        selectedJob
          ? `Drag candidates across stages for ${selectedJob.title}`
          : "Drag candidates across stages"
      }
      actions={
        <Select value={jobId} onValueChange={setJobId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter job" />
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
      }
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {total} applications across {PIPELINE_STAGES.length} stages
        </p>
        {error && (
          <Button size="sm" variant="outline" onClick={() => void load()}>
            Retry
          </Button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const column = columns[stage];
          const applications = column?.applications ?? [];
          const count = column?.count ?? applications.length;

          return (
            <section
              key={stage}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDragOverStage(stage);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDragOverStage(null);
                }
              }}
              onDrop={(event) => handleDrop(event, stage)}
              className={cn(
                "min-h-[620px] w-[300px] min-w-[300px] shrink-0 rounded-2xl border transition-colors",
                stageColumnClass(stage),
                dragOverStage === stage && "ring-2 ring-primary/50",
              )}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b border-border bg-background/90 px-3 py-3 backdrop-blur">
                <div>
                  <h3 className="text-sm font-semibold">
                    {STAGE_LABELS[stage] ?? stageLabel(stage)}
                  </h3>
                  <p className="text-xs text-muted-foreground">Drop here to move</p>
                </div>
                <Badge variant="outline" className={stageBadgeClass(stage)}>
                  {loading ? "..." : count}
                </Badge>
              </div>
              <div className="space-y-2 p-2">{renderColumnContent(stage, applications)}</div>
            </section>
          );
        })}
      </div>

      <Dialog open={!!pendingMove} onOpenChange={(open) => !open && setPendingMove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Provide the rejection reason before moving this application to{" "}
              {stageLabel("rejected")}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            placeholder="Reason for rejection"
            value={rejectedReason}
            onChange={(event) => setRejectedReason(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingMove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectedReason.trim()}
              onClick={() => void confirmRejectedMove()}
            >
              Move to rejected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HrLayout>
  );
}
