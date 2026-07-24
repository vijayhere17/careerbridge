import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  BriefcaseBusiness,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Star,
  StickyNote,
  Tag,
  Trash2,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  type HRApplication,
  type HRInterview,
} from "@/services/hrService";
import { cn } from "@/lib/utils";

type CandidateListItem = {
  id: number;
  name: string;
  email?: string | null;
  mobile?: string | null;
  location?: string | null;
  current_role?: string | null;
  experience?: string | null;
  education?: string | null;
  skills?: unknown[] | null;
  tags?: unknown[] | null;
  resume_url?: string | null;
  profile_photo?: string | null;
  applications_count?: number;
  latest_application_id?: number | null;
  latest_stage?: string | null;
  latest_stage_label?: string | null;
  latest_job?: { id: number; title: string; department?: string | null } | null;
  avg_rating?: number | string | null;
  interviews_count?: number;
  updated_at?: string | null;
};

type CandidateProfile = {
  id: number;
  name: string;
  last_name?: string | null;
  email?: string | null;
  mobile?: string | null;
  company?: string | null;
  current_role?: string | null;
  target_roles?: unknown[] | string | null;
  location?: string | null;
  bio?: string | null;
  experience?: string | null;
  education?: string | null;
  skills?: unknown[] | null;
  resume_url?: string | null;
  projects?: unknown[] | null;
  certificates?: unknown[] | null;
  portfolio?: string | null;
  linkedin?: string | null;
  github?: string | null;
  languages?: unknown[] | null;
  tags?: unknown[] | null;
  looking_for?: unknown[] | null;
  profile_photo?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CandidateNote = {
  id: number;
  note: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type CandidateTimelineEvent = {
  id: number;
  application_id?: number;
  job?: { id: number; title: string } | null;
  event: string;
  from_stage?: string | null;
  to_stage?: string | null;
  to_stage_label?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type CandidateDetailData = {
  candidate: CandidateProfile;
  application_history?: HRApplication[];
  applications?: HRApplication[];
  interview_history?: HRInterview[];
  interviews?: HRInterview[];
  timeline?: CandidateTimelineEvent[];
  ratings?: {
    average?: number | string | null;
    count?: number;
    items?: Array<{
      application_id: number;
      job_title?: string | null;
      rating?: number | null;
      stage?: string | null;
      stage_label?: string | null;
      updated_at?: string | null;
    }>;
  };
  notes?: CandidateNote[];
};

type CandidateFilters = {
  search: string;
  stage: string;
  rating: string;
};

const DEFAULT_FILTERS: CandidateFilters = {
  search: "",
  stage: "all",
  rating: "all",
};

function formatDate(value?: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return date.toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return date.toLocaleString();
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(toText).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(
        ([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== "",
      )
      .map(([key, entryValue]) => `${stageLabel(key)}: ${toText(entryValue)}`);
    return entries.join(" · ");
  }
  return "";
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(toText).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [toText(value)].filter(Boolean);
}

function normalizeUrl(value?: string | null) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function avatarInitials(name?: string | null) {
  return (name || "C")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function stageBadgeClass(stage?: string | null) {
  switch (stage) {
    case "rejected":
      return "border-destructive/20 bg-destructive/10 text-destructive";
    case "joined":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    default:
      return "border-primary/20 bg-primary-soft text-primary";
  }
}

function RatingStars({ rating }: { rating?: number | string | null }) {
  const numeric = Number(rating ?? 0);
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${numeric || 0} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            numeric >= n ? "fill-accent text-accent" : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}

function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function MissingSection() {
  return <HrEmptyState title="Not provided" />;
}

function TextSection({ value }: { value?: string | null }) {
  if (!value?.trim()) return <MissingSection />;
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{value}</p>
  );
}

function ChipList({ values }: { values?: unknown[] | string | null }) {
  const items = toStringArray(values);
  if (items.length === 0) return <MissingSection />;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="bg-muted/50">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function StructuredList({ values }: { values?: unknown[] | null }) {
  if (!values?.length) return <MissingSection />;
  return (
    <div className="space-y-3">
      {values.map((value, index) => {
        const text = toText(value);
        return (
          <div
            key={`${text}-${index}`}
            className="rounded-xl border border-border p-3 text-sm text-muted-foreground"
          >
            {text || "Not provided"}
          </div>
        );
      })}
    </div>
  );
}

function ExternalProfileLink({
  href,
  label,
  icon,
}: {
  href?: string | null;
  label: string;
  icon: ReactNode;
}) {
  if (!href) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <a href={normalizeUrl(href)} target="_blank" rel="noreferrer">
        {icon}
        {label}
      </a>
    </Button>
  );
}

export function HrCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [draftFilters, setDraftFilters] = useState<CandidateFilters>(DEFAULT_FILTERS);
  const [filters, setFilters] = useState<CandidateFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.listCandidates({
        page,
        per_page: 12,
        search: filters.search || undefined,
        stage: filters.stage === "all" ? undefined : filters.stage,
        rating: filters.rating === "all" ? undefined : filters.rating,
      });
      setCandidates(res.data.data);
      setLastPage(res.data.last_page || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load candidates"));
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setPage(1);
    setFilters({ ...draftFilters, search: draftFilters.search.trim() });
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  return (
    <HrLayout title="Candidates" subtitle="People in your hiring pipeline">
      <form
        onSubmit={applyFilters}
        className="rounded-2xl border border-border bg-card p-4 shadow-card"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
          <div className="relative xl:col-span-5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, email, phone, location, role, or skills"
              value={draftFilters.search}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, search: event.target.value }))
              }
            />
          </div>

          <Select
            value={draftFilters.stage}
            onValueChange={(value) => setDraftFilters((current) => ({ ...current, stage: value }))}
          >
            <SelectTrigger className="xl:col-span-2">
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
            value={draftFilters.rating}
            onValueChange={(value) => setDraftFilters((current) => ({ ...current, rating: value }))}
          >
            <SelectTrigger className="xl:col-span-2">
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

          <div className="flex gap-2 xl:col-span-3 xl:justify-end">
            <Button type="submit" variant="brand">
              Apply
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-6">
        {loading ? (
          <HrLoadingSkeleton rows={6} />
        ) : error ? (
          <HrErrorState message={error} onRetry={() => void load()} />
        ) : candidates.length === 0 ? (
          <HrEmptyState
            title="No candidates found"
            description="Adjust filters or review applications once candidates enter your pipeline."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {candidates.map((candidate) => {
              const skills = toStringArray(candidate.skills).slice(0, 4);
              return (
                <Card
                  key={candidate.id}
                  className="shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      {candidate.profile_photo ? (
                        <img
                          src={candidate.profile_photo}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                          {avatarInitials(candidate.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{candidate.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {candidate.email || "Not provided"}
                        </p>
                      </div>
                      {candidate.latest_stage && (
                        <Badge
                          variant="outline"
                          className={cn("shrink-0", stageBadgeClass(candidate.latest_stage))}
                        >
                          {candidate.latest_stage_label ?? stageLabel(candidate.latest_stage)}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {candidate.current_role && (
                        <div className="flex items-center gap-2">
                          <BriefcaseBusiness className="h-4 w-4" />
                          <span className="truncate">{candidate.current_role}</span>
                        </div>
                      )}
                      {candidate.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{candidate.location}</span>
                        </div>
                      )}
                      {candidate.latest_job && (
                        <p className="truncate">
                          Latest application:{" "}
                          <span className="font-medium text-foreground">
                            {candidate.latest_job.title}
                          </span>
                        </p>
                      )}
                    </div>

                    {skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="bg-muted/50">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center text-xs">
                      <div>
                        <p className="font-semibold text-foreground">
                          {candidate.applications_count ?? 0}
                        </p>
                        <p className="text-muted-foreground">Apps</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {candidate.interviews_count ?? 0}
                        </p>
                        <p className="text-muted-foreground">Interviews</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {candidate.avg_rating || "0"}
                        </p>
                        <p className="text-muted-foreground">Rating</p>
                      </div>
                    </div>

                    <Button asChild className="mt-4 w-full" variant="outline" size="sm">
                      <Link to="/hr/candidates/$id" params={{ id: String(candidate.id) }}>
                        View profile
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {lastPage} · {total} total candidates
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
    </HrLayout>
  );
}

export function HrCandidateDetailPage({ candidateId }: { candidateId: number }) {
  const [data, setData] = useState<CandidateDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [tagsValue, setTagsValue] = useState("");
  const [savingTags, setSavingTags] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);

  const applications = data?.application_history ?? data?.applications ?? [];
  const interviews = data?.interview_history ?? data?.interviews ?? [];
  const notes = data?.notes ?? [];
  const candidate = data?.candidate;

  const currentTags = useMemo(() => toStringArray(candidate?.tags), [candidate?.tags]);

  const load = useCallback(async () => {
    if (!Number.isFinite(candidateId)) {
      setError("Invalid candidate id");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await hrService.getCandidate(candidateId);
      const nextData = res.data as CandidateDetailData;
      setData(nextData);
      setTagsValue(toStringArray(nextData.candidate.tags).join(", "));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load candidate"));
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveTags = async () => {
    if (!candidate) return;
    const tags = tagsValue
      .split(",")
      .map((tagValue) => tagValue.trim())
      .filter(Boolean);

    setSavingTags(true);
    try {
      await hrService.updateCandidateTags(candidate.id, tags);
      setData((current) =>
        current
          ? {
              ...current,
              candidate: {
                ...current.candidate,
                tags,
              },
            }
          : current,
      );
      setTagsValue(tags.join(", "));
      toast.success("Tags updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to update tags"));
    } finally {
      setSavingTags(false);
    }
  };

  const addNote = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    setSavingNote(true);
    try {
      await hrService.addCandidateNote(candidateId, trimmed);
      setNote("");
      toast.success("Note added");
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to add note"));
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async () => {
    if (!deleteNoteId) return;
    try {
      await hrService.deleteCandidateNote(candidateId, deleteNoteId);
      toast.success("Note deleted");
      setDeleteNoteId(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to delete note"));
    }
  };

  return (
    <HrLayout
      title={candidate?.name ?? "Candidate"}
      subtitle="Professional profile and hiring history"
    >
      {loading ? (
        <HrLoadingSkeleton rows={8} />
      ) : error ? (
        <HrErrorState message={error} onRetry={() => void load()} />
      ) : candidate ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <Card className="shadow-card">
              <CardContent className="p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  {candidate.profile_photo ? (
                    <img
                      src={candidate.profile_photo}
                      alt=""
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid h-20 w-20 place-items-center rounded-full bg-primary-soft text-2xl font-bold text-primary">
                      {avatarInitials(candidate.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-2xl font-bold">{candidate.name}</h2>
                    {candidate.current_role || candidate.company ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[candidate.current_role, candidate.company].filter(Boolean).join(" @ ")}
                      </p>
                    ) : null}
                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{candidate.email || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{candidate.mobile || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{candidate.location || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4" />
                        <span>{toText(candidate.target_roles) || "Not provided"}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {candidate.resume_url && (
                        <Button asChild variant="brand" size="sm">
                          <a href={candidate.resume_url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Resume
                          </a>
                        </Button>
                      )}
                      <ExternalProfileLink
                        href={candidate.portfolio}
                        label="Portfolio"
                        icon={<ExternalLink className="h-4 w-4" />}
                      />
                      <ExternalProfileLink
                        href={candidate.linkedin}
                        label="LinkedIn"
                        icon={<Linkedin className="h-4 w-4" />}
                      />
                      <ExternalProfileLink
                        href={candidate.github}
                        label="GitHub"
                        icon={<Github className="h-4 w-4" />}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-5">
                  <TextSection value={candidate.bio} />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Experience">
                <TextSection value={candidate.experience} />
              </SectionCard>
              <SectionCard title="Education">
                <TextSection value={candidate.education} />
              </SectionCard>
            </div>

            <SectionCard title="Skills">
              <ChipList values={candidate.skills} />
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="Projects">
                <StructuredList values={candidate.projects} />
              </SectionCard>
              <SectionCard title="Certificates">
                <StructuredList values={candidate.certificates} />
              </SectionCard>
            </div>

            <SectionCard title="Languages">
              <ChipList values={candidate.languages} />
            </SectionCard>

            <SectionCard title="Application history">
              {applications.length === 0 ? (
                <MissingSection />
              ) : (
                <div className="space-y-3">
                  {applications.map((application) => (
                    <div key={application.id} className="rounded-xl border border-border p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">
                            {application.job?.title ?? "Not provided"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Applied {formatDate(application.applied_at ?? application.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={stageBadgeClass(application.current_stage)}
                          >
                            {application.stage_label ?? stageLabel(application.current_stage)}
                          </Badge>
                          <RatingStars rating={application.rating} />
                        </div>
                      </div>
                      {application.hr_notes && (
                        <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                          {application.hr_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Interview history">
              {interviews.length === 0 ? (
                <MissingSection />
              ) : (
                <div className="space-y-3">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="rounded-xl border border-border p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold">{interview.interview_type ?? "Interview"}</p>
                          <p className="text-xs text-muted-foreground">
                            {interview.job?.title ?? "Not provided"} ·{" "}
                            {formatDateTime(interview.scheduled_at)}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {interview.status}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <p>Interviewer: {interview.interviewer_name || "Not provided"}</p>
                        <p>Result: {interview.result || "Not provided"}</p>
                        <p>
                          Duration:{" "}
                          {interview.duration ? `${interview.duration} minutes` : "Not provided"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span>Rating:</span>
                          <RatingStars rating={interview.rating} />
                        </div>
                      </div>
                      {(interview.feedback || interview.notes) && (
                        <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                          {interview.feedback || interview.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Timeline">
              {(data.timeline ?? []).length === 0 ? (
                <MissingSection />
              ) : (
                <div className="space-y-3">
                  {data.timeline!.map((event) => (
                    <div key={event.id} className="rounded-xl border border-border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{stageLabel(event.event)}</p>
                        {event.job?.title && <Badge variant="outline">{event.job.title}</Badge>}
                        {event.to_stage && (
                          <Badge variant="outline" className={stageBadgeClass(event.to_stage)}>
                            {event.to_stage_label ?? stageLabel(event.to_stage)}
                          </Badge>
                        )}
                      </div>
                      {event.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDateTime(event.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard title="Tags" action={<Tag className="h-4 w-4 text-primary" />}>
              <div className="space-y-3">
                {currentTags.length > 0 ? <ChipList values={currentTags} /> : <MissingSection />}
                <Textarea
                  rows={3}
                  placeholder="Add tags separated by commas"
                  value={tagsValue}
                  onChange={(event) => setTagsValue(event.target.value)}
                />
                <Button
                  variant="brand"
                  size="sm"
                  disabled={savingTags}
                  onClick={() => void saveTags()}
                >
                  {savingTags ? "Saving..." : "Save tags"}
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Ratings">
              <div className="flex items-end gap-3">
                <p className="font-display text-4xl font-bold">{data.ratings?.average ?? 0}</p>
                <p className="pb-1 text-sm text-muted-foreground">
                  {data.ratings?.count ?? 0} ratings
                </p>
              </div>
              <div className="mt-2">
                <RatingStars rating={data.ratings?.average} />
              </div>
              {(data.ratings?.items ?? []).length > 0 && (
                <div className="mt-4 space-y-2">
                  {data.ratings!.items!.map((item) => (
                    <div
                      key={item.application_id}
                      className="rounded-xl border border-border p-3 text-sm"
                    >
                      <p className="font-medium">{item.job_title || "Not provided"}</p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <Badge variant="outline" className={stageBadgeClass(item.stage)}>
                          {item.stage_label ??
                            (item.stage ? stageLabel(item.stage) : "Not provided")}
                        </Badge>
                        <RatingStars rating={item.rating} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Notes" action={<StickyNote className="h-4 w-4 text-primary" />}>
              <Textarea
                rows={4}
                placeholder="Add an internal note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <Button
                className="mt-2"
                size="sm"
                variant="brand"
                disabled={savingNote || !note.trim()}
                onClick={() => void addNote()}
              >
                <Plus className="h-4 w-4" />
                {savingNote ? "Saving..." : "Add note"}
              </Button>

              <div className="mt-4 space-y-3">
                {notes.length === 0 ? (
                  <MissingSection />
                ) : (
                  notes.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {item.note}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive"
                          onClick={() => setDeleteNoteId(item.id)}
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      ) : (
        <HrEmptyState title="Not provided" description="Candidate details were not returned." />
      )}

      <HrConfirmDialog
        open={deleteNoteId !== null}
        onOpenChange={(open) => !open && setDeleteNoteId(null)}
        title="Delete note?"
        description="This internal candidate note will be permanently deleted."
        confirmLabel="Delete note"
        destructive
        onConfirm={() => void deleteNote()}
      />
    </HrLayout>
  );
}
