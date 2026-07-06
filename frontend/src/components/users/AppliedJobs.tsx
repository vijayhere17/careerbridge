import { useState } from "react";
import {
  Briefcase, MapPin, Clock, Search, X,
  CheckCircle2, XCircle, AlertCircle, Eye,
  ChevronRight, ExternalLink, FileText, Calendar,
  Building2, DollarSign,
} from "lucide-react";

type AppStatus =
  | "Applied"
  | "Under Review"
  | "Shortlisted"
  | "Interview Scheduled"
  | "Offer Received"
  | "Selected"
  | "Rejected";

interface AppliedJob {
  id: string;
  company: string;
  initials: string;
  role: string;
  location: string;
  salary: string;
  workType: "Remote" | "Hybrid" | "Onsite";
  appliedDate: string;
  status: AppStatus;
  jobType: string;
  lastUpdate: string;
  interviewDate?: string;
  offerAmount?: string;
  rejectionReason?: string;
}

const MOCK_JOBS: AppliedJob[] = [
  {
    id: "j1",
    company: "Razorpay",
    initials: "RP",
    role: "Senior Full-Stack Engineer",
    location: "Bengaluru",
    salary: "₹18–30 LPA",
    workType: "Hybrid",
    appliedDate: "2025-07-10",
    lastUpdate: "2025-07-12",
    status: "Interview Scheduled",
    jobType: "Full Time",
    interviewDate: "2025-07-22 at 11:00 AM",
  },
  {
    id: "j2",
    company: "Zepto",
    initials: "ZP",
    role: "Backend Engineer – Platform",
    location: "Mumbai",
    salary: "₹15–25 LPA",
    workType: "Onsite",
    appliedDate: "2025-07-08",
    lastUpdate: "2025-07-10",
    status: "Under Review",
    jobType: "Full Time",
  },
  {
    id: "j3",
    company: "CRED",
    initials: "CR",
    role: "Data Scientist – Credit Risk",
    location: "Bengaluru",
    salary: "₹20–35 LPA",
    workType: "Onsite",
    appliedDate: "2025-07-05",
    lastUpdate: "2025-07-15",
    status: "Offer Received",
    jobType: "Full Time",
    offerAmount: "₹28 LPA",
  },
  {
    id: "j4",
    company: "Ather Energy",
    initials: "AE",
    role: "Embedded Systems Engineer",
    location: "Bengaluru",
    salary: "₹16–28 LPA",
    workType: "Onsite",
    appliedDate: "2025-06-28",
    lastUpdate: "2025-07-02",
    status: "Shortlisted",
    jobType: "Full Time",
  },
  {
    id: "j5",
    company: "DesignCo Studio",
    initials: "DC",
    role: "Freelance UI/UX Designer",
    location: "Remote",
    salary: "₹1.5–3L project",
    workType: "Remote",
    appliedDate: "2025-06-20",
    lastUpdate: "2025-06-25",
    status: "Rejected",
    jobType: "Freelance",
    rejectionReason: "Position filled internally.",
  },
  {
    id: "j6",
    company: "Groww",
    initials: "GW",
    role: "Product Manager – Payments",
    location: "Bengaluru",
    salary: "₹22–38 LPA",
    workType: "Hybrid",
    appliedDate: "2025-06-15",
    lastUpdate: "2025-06-16",
    status: "Applied",
    jobType: "Full Time",
  },
  {
    id: "j7",
    company: "TalentBridge HR",
    initials: "TB",
    role: "DevOps Engineer",
    location: "Remote",
    salary: "₹18–28 LPA",
    workType: "Remote",
    appliedDate: "2025-06-10",
    lastUpdate: "2025-07-01",
    status: "Selected",
    jobType: "Full Time",
  },
];

const STATUS_PIPELINE: AppStatus[] = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Offer Received",
  "Selected",
];

const STATUS_CONFIG: Record<AppStatus, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  "Applied":            { color: "text-muted-foreground", bg: "bg-muted border-border",           icon: Clock,        label: "Applied" },
  "Under Review":       { color: "text-primary",          bg: "bg-primary/10 border-primary/20",  icon: Eye,          label: "Under Review" },
  "Shortlisted":        { color: "text-primary",          bg: "bg-primary/10 border-primary/20",  icon: CheckCircle2, label: "Shortlisted" },
  "Interview Scheduled":{ color: "text-primary",          bg: "bg-primary/10 border-primary/20",  icon: Calendar,     label: "Interview Scheduled" },
  "Offer Received":     { color: "text-primary",          bg: "bg-primary/10 border-primary/20",  icon: CheckCircle2, label: "Offer Received" },
  "Selected":           { color: "text-primary",          bg: "bg-primary/10 border-primary/20",  icon: CheckCircle2, label: "Selected" },
  "Rejected":           { color: "text-red-600",          bg: "bg-red-50 border-red-200",         icon: XCircle,      label: "Rejected" },
};

const TABS: { id: AppStatus | "all"; label: string }[] = [
  { id: "all",               label: "All" },
  { id: "Under Review",      label: "In Progress" },
  { id: "Interview Scheduled", label: "Interview" },
  { id: "Offer Received",    label: "Offer" },
  { id: "Rejected",          label: "Rejected" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: AppStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ status }: { status: AppStatus }) {
  if (status === "Rejected") return null;
  const idx = STATUS_PIPELINE.indexOf(status);
  return (
    <div className="mt-3">
      <div className="flex gap-0.5">
        {STATUS_PIPELINE.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= idx ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">Applied</span>
        <span className="text-[10px] text-muted-foreground">Selected</span>
      </div>
    </div>
  );
}

function DetailDrawer({ job, onClose }: { job: AppliedJob; onClose: () => void }) {
  const cfg = STATUS_CONFIG[job.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 lg:items-stretch" onClick={onClose}>
      <div
        className="relative flex h-[90vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-surface lg:h-full lg:w-[440px] lg:rounded-none lg:rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <span className="font-semibold text-sm truncate pr-4">{job.role}</span>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-4">
          <div className="flex items-start gap-3 rounded-xl border border-border p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
              {job.initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm">{job.company}</p>
              <p className="text-xs text-muted-foreground">{job.role}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />{job.location}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <DollarSign className="h-3 w-3" />{job.salary}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Application Status</p>
            <div className="flex items-center justify-between mb-3">
              <StatusBadge status={job.status} />
              <span className="text-[11px] text-muted-foreground">Updated {formatDate(job.lastUpdate)}</span>
            </div>
            <ProgressBar status={job.status} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Applied On",   value: formatDate(job.appliedDate) },
              { label: "Job Type",     value: job.jobType },
              { label: "Work Mode",    value: job.workType },
              { label: "Last Updated", value: formatDate(job.lastUpdate) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border p-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-xs font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {job.status === "Interview Scheduled" && job.interviewDate && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-primary">Interview Scheduled</p>
              </div>
              <p className="text-sm text-muted-foreground">{job.interviewDate}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Check your email for the meeting link and details.</p>
            </div>
          )}

          {job.status === "Offer Received" && job.offerAmount && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-primary">Offer Received</p>
              </div>
              <p className="text-2xl font-bold mt-1">{job.offerAmount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Review the offer letter sent to your registered email.</p>
            </div>
          )}

          {job.status === "Selected" && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-bold text-sm">Congratulations!</p>
              <p className="text-xs text-muted-foreground mt-1">You have been selected for this role. Check your email for next steps.</p>
            </div>
          )}

          {job.status === "Rejected" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm font-semibold text-red-600">Application Not Selected</p>
              </div>
              {job.rejectionReason && (
                <p className="text-xs text-muted-foreground mt-1">{job.rejectionReason}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-2">Don't be discouraged — keep applying and exploring new opportunities.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, onView }: { job: AppliedJob; onView: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
          {job.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{job.role}</p>
              <p className="text-xs text-muted-foreground truncate">{job.company}</p>
            </div>
            <StatusBadge status={job.status} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />{job.location}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Briefcase className="h-3 w-3" />{job.workType}
            </span>
            <span className="text-[11px] font-semibold text-primary">{job.salary}</span>
          </div>

          <ProgressBar status={job.status} />

          {job.status === "Interview Scheduled" && job.interviewDate && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/15 px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[11px] text-primary font-medium">Interview: {job.interviewDate}</p>
            </div>
          )}

          {job.status === "Offer Received" && job.offerAmount && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/15 px-3 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[11px] text-primary font-medium">Offer: {job.offerAmount}</p>
            </div>
          )}

          {job.status === "Rejected" && (
            <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <p className="text-[11px] text-red-600">Not selected{job.rejectionReason ? ` — ${job.rejectionReason}` : ""}</p>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> Applied {formatDate(job.appliedDate)}
            </span>
            <button
              onClick={onView}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Details <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppliedJobs() {
  const [jobs] = useState<AppliedJob[]>(MOCK_JOBS);
  const [activeTab, setActiveTab] = useState<AppStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<AppliedJob | null>(null);

  const filtered = jobs.filter((j) => {
    const matchTab =
      activeTab === "all" ||
      (activeTab === "Under Review" && ["Under Review", "Shortlisted"].includes(j.status)) ||
      j.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q || j.role.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const counts = {
    all: jobs.length,
    "Under Review": jobs.filter((j) => ["Under Review", "Shortlisted"].includes(j.status)).length,
    "Interview Scheduled": jobs.filter((j) => j.status === "Interview Scheduled").length,
    "Offer Received": jobs.filter((j) => ["Offer Received", "Selected"].includes(j.status)).length,
    Rejected: jobs.filter((j) => j.status === "Rejected").length,
  };

  const stats = [
    { label: "Total Applied", value: jobs.length },
    { label: "In Progress",   value: jobs.filter((j) => !["Rejected", "Selected"].includes(j.status)).length },
    { label: "Interviews",    value: jobs.filter((j) => j.status === "Interview Scheduled").length },
    { label: "Offers",        value: jobs.filter((j) => ["Offer Received", "Selected"].includes(j.status)).length },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by role or company…"
          className="dash-input w-full pl-9"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const count = counts[tab.id as keyof typeof counts] ?? jobs.length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.id ? "bg-white/20" : "bg-muted"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted mb-3">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No applications found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Try a different search term." : "You haven't applied to any jobs yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} onView={() => setSelectedJob(job)} />
          ))}
        </div>
      )}

      {selectedJob && (
        <DetailDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}