import { apiFetch } from "@/lib/auth";

export type SeekerAppStatus =
  | "Applied"
  | "Under Review"
  | "Shortlisted"
  | "Interview Scheduled"
  | "Offer Received"
  | "Selected"
  | "Rejected";

export type SeekerAppKind = "job" | "internship";

export interface RawSeekerApplication {
  id: string | number;
  opportunityId?: string | number;
  source?: string;
  category?: string;
  opportunityType?: string;
  company?: string;
  companyLogo?: string;
  recruiter?: string;
  title?: string;
  role?: string;
  location?: string;
  salary?: string;
  workType?: string;
  jobType?: string;
  employmentType?: string;
  duration?: string;
  ppoChance?: boolean;
  status?: string;
  appliedAt?: string;
  lastUpdate?: string;
  interviewDate?: string;
  interview_at?: string;
  offerAmount?: string;
  rejectionReason?: string;
}

export interface NormalizedSeekerApplication {
  id: string;
  opportunityId: string;
  source: "legacy" | "recruiter";
  kind: SeekerAppKind | "other";
  company: string;
  initials: string;
  recruiter: string;
  role: string;
  location: string;
  salary: string;
  workType: "Remote" | "Hybrid" | "Onsite";
  jobType: string;
  duration: string;
  appliedDate: string;
  lastUpdate: string;
  status: SeekerAppStatus;
  interviewDate?: string;
  offerAmount?: string;
  rejectionReason?: string;
  ppoChance?: boolean;
}

/** Map recruiter snake_case statuses to Job Seeker Title Case labels. */
export function mapRecruiterStatus(status?: string): SeekerAppStatus {
  const normalized = (status || "new").toLowerCase();
  const map: Record<string, SeekerAppStatus> = {
    new: "Applied",
    pending: "Applied",
    applied: "Applied",
    under_review: "Under Review",
    shortlisted: "Shortlisted",
    interview: "Interview Scheduled",
    interview_completed: "Interview Scheduled",
    accepted: "Offer Received",
    rejected: "Rejected",
    withdrawn: "Rejected",
    hired: "Selected",
    completed: "Selected",
  };
  return map[normalized] || "Applied";
}

function mapLegacyStatus(status?: string): SeekerAppStatus {
  const allowed: SeekerAppStatus[] = [
    "Applied",
    "Under Review",
    "Shortlisted",
    "Interview Scheduled",
    "Offer Received",
    "Selected",
    "Rejected",
  ];
  if (status && allowed.includes(status as SeekerAppStatus)) {
    return status as SeekerAppStatus;
  }
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("reject")) return "Rejected";
  if (normalized.includes("interview")) return "Interview Scheduled";
  if (normalized.includes("shortlist")) return "Shortlisted";
  if (normalized.includes("offer")) return "Offer Received";
  if (normalized.includes("select") || normalized.includes("hired") || normalized.includes("join")) {
    return "Selected";
  }
  if (normalized.includes("review")) return "Under Review";
  return "Applied";
}

function normalizeWorkType(value?: string): "Remote" | "Hybrid" | "Onsite" {
  const v = (value || "").toLowerCase();
  if (v.includes("remote")) return "Remote";
  if (v.includes("hybrid")) return "Hybrid";
  return "Onsite";
}

function initialsFrom(company?: string, logo?: string): string {
  if (logo && logo.length <= 4 && !logo.includes("/") && !logo.includes(".")) {
    return logo.toUpperCase();
  }
  return (company || "CO")
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function detectKind(app: RawSeekerApplication): SeekerAppKind | "other" {
  const type = (app.opportunityType || "").toLowerCase();
  const category = (app.category || "").toLowerCase();
  const jobType = (app.jobType || app.employmentType || "").toLowerCase();

  if (
    type === "internship" ||
    category === "internships" ||
    category === "internship" ||
    jobType.includes("intern")
  ) {
    return "internship";
  }

  if (type === "freelance" || category === "freelance") {
    return "other";
  }

  if (jobType.includes("intern")) return "internship";

  if (
    type === "job" ||
    category === "jobs" ||
    category === "job" ||
    jobType.includes("full") ||
    jobType.includes("part") ||
    jobType.includes("contract") ||
    (!type && !category)
  ) {
    return "job";
  }

  return "other";
}

export function normalizeSeekerApplication(app: RawSeekerApplication): NormalizedSeekerApplication {
  const source = app.source === "recruiter" ? "recruiter" : "legacy";
  const status =
    source === "recruiter" ? mapRecruiterStatus(app.status) : mapLegacyStatus(app.status);

  return {
    id: String(app.id),
    opportunityId: String(app.opportunityId ?? ""),
    source,
    kind: detectKind(app),
    company: app.company || "Company",
    initials: initialsFrom(app.company, app.companyLogo),
    recruiter: app.recruiter || "—",
    role: app.title || app.role || "Opportunity",
    location: app.location || "—",
    salary: app.salary || "—",
    workType: normalizeWorkType(app.workType),
    jobType: app.jobType || app.employmentType || "—",
    duration: app.duration || "—",
    appliedDate: app.appliedAt || new Date().toISOString(),
    lastUpdate: app.lastUpdate || app.appliedAt || new Date().toISOString(),
    status,
    interviewDate: app.interviewDate || undefined,
    offerAmount: app.offerAmount || undefined,
    rejectionReason: app.rejectionReason || undefined,
    ppoChance: Boolean(app.ppoChance),
  };
}

function extractRecruiterList(payload: any): RawSeekerApplication[] {
  if (Array.isArray(payload?.applications)) return payload.applications;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

/** Load legacy + recruiter applications and filter by job/internship. */
export async function loadSeekerApplications(
  kind: SeekerAppKind,
): Promise<NormalizedSeekerApplication[]> {
  const results: NormalizedSeekerApplication[] = [];

  try {
    const legacy = await apiFetch<{ applications: RawSeekerApplication[] }>(
      "/api/opportunities/applications",
    );
    for (const app of legacy.applications ?? []) {
      results.push(
        normalizeSeekerApplication({
          ...app,
          source: app.source || "legacy",
        }),
      );
    }
  } catch (err) {
    console.error("Failed to load legacy applications:", err);
  }

  try {
    const recruiter = await apiFetch<any>("/api/recruiter-opportunities/applications");
    for (const app of extractRecruiterList(recruiter)) {
      results.push(
        normalizeSeekerApplication({
          ...app,
          source: "recruiter",
        }),
      );
    }
  } catch (err) {
    console.error("Failed to load recruiter applications:", err);
  }

  const filtered = results.filter((app) => app.kind === kind);

  // Newest first
  filtered.sort(
    (a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime(),
  );

  return filtered;
}
