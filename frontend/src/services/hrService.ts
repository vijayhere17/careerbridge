import { apiFetch } from "@/lib/auth";

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type HRJob = {
  id: number;
  hr_id: number;
  title: string;
  department?: string | null;
  location?: string | null;
  employment_type?: string | null;
  experience?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  openings: number;
  status: "draft" | "open" | "closed" | "on_hold" | "archived";
  description?: string | null;
  requirements?: string | null;
  responsibilities?: string | null;
  published_at?: string | null;
  closed_at?: string | null;
  archived_at?: string | null;
  applications_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type HRCandidateBrief = {
  id: number;
  name: string;
  email?: string | null;
  mobile?: string | null;
  location?: string | null;
  experience?: string | null;
  education?: string | null;
  skills?: string[] | null;
  projects?: unknown[] | null;
  certificates?: unknown[] | null;
  languages?: unknown[] | null;
  tags?: string[] | null;
  profile_photo?: string | null;
  resume_path?: string | null;
  bio?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  company?: string | null;
  current_role?: string | null;
};

export type HRTimelineEvent = {
  id: number;
  event: string;
  from_stage?: string | null;
  to_stage?: string | null;
  description?: string | null;
  created_at?: string;
};

export type HRApplication = {
  id: number;
  job_id: number;
  candidate_id: number;
  current_stage: string;
  stage_label?: string;
  rating?: number | null;
  source?: string | null;
  expected_salary?: number | null;
  resume_url?: string | null;
  applied_at?: string | null;
  interview_date?: string | null;
  interview_mode?: string | null;
  interview_link?: string | null;
  interviewer_notes?: string | null;
  hr_notes?: string | null;
  offer_salary?: number | null;
  offer_status?: string;
  offer_sent_at?: string | null;
  joined_date?: string | null;
  rejected_reason?: string | null;
  shortlisted_at?: string | null;
  rejected_at?: string | null;
  interview_status?: string | null;
  created_at?: string;
  updated_at?: string;
  candidate?: HRCandidateBrief | null;
  job?: Pick<HRJob, "id" | "title" | "department" | "location" | "status"> | null;
  interviews?: HRInterview[];
  timeline?: HRTimelineEvent[];
};

export type HRInterview = {
  id: number;
  application_id: number;
  interviewer_name?: string | null;
  panel?: string[] | null;
  interview_type?: string | null;
  meeting_link?: string | null;
  scheduled_at: string;
  duration: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  feedback?: string | null;
  notes?: string | null;
  rating?: number | null;
  result?: string | null;
  candidate?: HRCandidateBrief | null;
  job?: Pick<HRJob, "id" | "title" | "department"> | null;
};

export type HRProfile = {
  id?: number;
  company_name: string;
  designation?: string | null;
  department?: string | null;
  company_logo?: string | null;
  company_cover?: string | null;
  cover_url?: string | null;
  company_website?: string | null;
  industry?: string | null;
  company_size?: string | null;
  company_description?: string | null;
  culture?: string | null;
  benefits?: string | null;
  office_location?: string | null;
  locations?: string[] | null;
  phone?: string | null;
  linkedin?: string | null;
  social_links?: Record<string, string> | null;
  verified?: boolean;
  status?: string;
};

export type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
  stages?: string[];
  stage_labels?: Record<string, string>;
};

function qs(params: Record<string, string | number | boolean | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) search.set(k, String(v));
  });
  const q = search.toString();
  return q ? `?${q}` : "";
}

async function hrFetch<T>(path: string, init?: RequestInit) {
  return apiFetch<ApiSuccess<T>>(`/api/hr${path}`, init);
}

export const PIPELINE_STAGES = [
  "applied",
  "screening",
  "technical",
  "hr_round",
  "manager_round",
  "final_interview",
  "offer",
  "joined",
  "rejected",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  technical: "Technical",
  hr_round: "HR Round",
  manager_round: "Manager Round",
  final_interview: "Final Interview",
  offer: "Offer",
  joined: "Joined",
  rejected: "Rejected",
};

export function stageLabel(stage: string) {
  if (STAGE_LABELS[stage]) return STAGE_LABELS[stage];
  return stage
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const hrService = {
  dashboard: () => hrFetch<any>("/dashboard"),

  listJobs: (params: Record<string, string | number | undefined> = {}) =>
    hrFetch<Paginated<HRJob>>(`/jobs${qs(params)}`),

  getJob: (id: number) => hrFetch<HRJob>(`/jobs/${id}`),

  createJob: (payload: Partial<HRJob>) =>
    hrFetch<HRJob>("/jobs", { method: "POST", body: JSON.stringify(payload) }),

  updateJob: (id: number, payload: Partial<HRJob>) =>
    hrFetch<HRJob>(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  closeJob: (id: number) => hrFetch<HRJob>(`/jobs/${id}/close`, { method: "POST" }),
  reopenJob: (id: number) => hrFetch<HRJob>(`/jobs/${id}/reopen`, { method: "POST" }),
  archiveJob: (id: number) => hrFetch<HRJob>(`/jobs/${id}/archive`, { method: "POST" }),
  publishJob: (id: number) => hrFetch<HRJob>(`/jobs/${id}/publish`, { method: "POST" }),
  draftJob: (id: number) => hrFetch<HRJob>(`/jobs/${id}/draft`, { method: "POST" }),
  duplicateJob: (id: number) => hrFetch<HRJob>(`/jobs/${id}/duplicate`, { method: "POST" }),
  deleteJob: (id: number) => hrFetch<null>(`/jobs/${id}`, { method: "DELETE" }),

  bulkJobs: (payload: { ids: number[]; action: string }) =>
    hrFetch<{ updated: number }>("/jobs/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listApplications: (params: Record<string, string | number | undefined> = {}) =>
    hrFetch<Paginated<HRApplication>>(`/applications${qs(params)}`),

  getApplication: (id: number) => hrFetch<HRApplication>(`/applications/${id}`),

  updateApplication: (id: number, payload: Partial<HRApplication>) =>
    hrFetch<HRApplication>(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  shortlistApplication: (id: number) =>
    hrFetch<HRApplication>(`/applications/${id}/shortlist`, { method: "POST" }),

  rejectApplication: (id: number, rejected_reason?: string) =>
    hrFetch<HRApplication>(`/applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejected_reason }),
    }),

  bulkUpdateApplications: (payload: {
    ids: number[];
    current_stage?: string;
    rating?: number;
    action?: string;
    rejected_reason?: string;
  }) =>
    hrFetch<{ updated: number }>("/applications/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listCandidates: (params: Record<string, string | number | undefined> = {}) =>
    hrFetch<Paginated<any>>(`/candidates${qs(params)}`),

  getCandidate: (id: number) => hrFetch<any>(`/candidates/${id}`),

  addCandidateNote: (id: number, note: string) =>
    hrFetch<any>(`/candidates/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  deleteCandidateNote: (candidateId: number, noteId: number) =>
    hrFetch<null>(`/candidates/${candidateId}/notes/${noteId}`, { method: "DELETE" }),

  updateCandidateTags: (id: number, tags: string[]) =>
    hrFetch<any>(`/candidates/${id}/tags`, {
      method: "POST",
      body: JSON.stringify({ tags }),
    }),

  listInterviews: (params: Record<string, string | number | undefined> = {}) =>
    hrFetch<Paginated<HRInterview>>(`/interviews${qs(params)}`),

  interviewCalendar: (params: Record<string, string | undefined> = {}) =>
    hrFetch<Record<string, HRInterview[]>>(`/interviews/calendar${qs(params)}`),

  createInterview: (
    payload: Partial<HRInterview> & { application_id: number; scheduled_at: string },
  ) => hrFetch<HRInterview>("/interviews", { method: "POST", body: JSON.stringify(payload) }),

  updateInterview: (id: number, payload: Partial<HRInterview>) =>
    hrFetch<HRInterview>(`/interviews/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  completeInterview: (
    id: number,
    payload: { feedback?: string; rating?: number; result?: string },
  ) =>
    hrFetch<HRInterview>(`/interviews/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  cancelInterview: (id: number, notes?: string) =>
    hrFetch<HRInterview>(`/interviews/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),

  rescheduleInterview: (id: number, scheduled_at: string) =>
    hrFetch<HRInterview>(`/interviews/${id}/reschedule`, {
      method: "POST",
      body: JSON.stringify({ scheduled_at }),
    }),

  deleteInterview: (id: number) => hrFetch<null>(`/interviews/${id}`, { method: "DELETE" }),

  pipeline: (jobId?: number) => hrFetch<any>(`/pipeline${jobId ? `?job_id=${jobId}` : ""}`),

  movePipeline: (id: number, stage: string, rejected_reason?: string) =>
    hrFetch<any>(`/pipeline/${id}/move`, {
      method: "POST",
      body: JSON.stringify({ stage, rejected_reason }),
    }),

  reports: () => hrFetch<any>("/reports"),

  getProfile: () => hrFetch<{ user: any; profile: HRProfile | null }>("/profile"),

  updateProfile: (formData: FormData) =>
    hrFetch<{ user: any; profile: HRProfile }>("/profile", {
      method: "POST",
      body: formData,
    }),

  notifications: (params: Record<string, string | number | boolean | undefined> = {}) =>
    hrFetch<{ notifications: Paginated<any> | any[]; unread_count: number }>(
      `/notifications${qs(params)}`,
    ),

  unreadNotifications: () => hrFetch<{ unread_count: number }>("/notifications/unread-count"),

  markNotificationRead: (id: number) =>
    hrFetch<any>(`/notifications/${id}/read`, { method: "POST" }),

  markAllNotificationsRead: () => hrFetch<null>("/notifications/read-all", { method: "POST" }),

  deleteNotification: (id: number) => hrFetch<null>(`/notifications/${id}`, { method: "DELETE" }),

  getSettings: () => hrFetch<any>("/settings"),

  updateSettingsProfile: (payload: { name: string; mobile?: string }) =>
    hrFetch<any>("/settings/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) =>
    hrFetch<null>("/settings/password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updatePreferences: (payload: Record<string, boolean>) =>
    hrFetch<any>("/settings/preferences", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return hrFetch<any>("/settings/avatar", { method: "POST", body: fd });
  },
};
