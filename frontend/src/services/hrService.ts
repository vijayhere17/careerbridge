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
  status: "draft" | "open" | "closed" | "on_hold";
  description?: string | null;
  requirements?: string | null;
  responsibilities?: string | null;
  published_at?: string | null;
  closed_at?: string | null;
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
  profile_photo?: string | null;
  bio?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  company?: string | null;
  current_role?: string | null;
};

export type HRApplication = {
  id: number;
  job_id: number;
  candidate_id: number;
  current_stage: string;
  rating?: number | null;
  interview_date?: string | null;
  interview_mode?: string | null;
  interview_link?: string | null;
  interviewer_notes?: string | null;
  hr_notes?: string | null;
  offer_salary?: number | null;
  offer_status?: string;
  joined_date?: string | null;
  rejected_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  candidate?: HRCandidateBrief | null;
  job?: Pick<HRJob, "id" | "title" | "department" | "location" | "status"> | null;
  interviews?: HRInterview[];
};

export type HRInterview = {
  id: number;
  application_id: number;
  interviewer_name?: string | null;
  interview_type?: string | null;
  meeting_link?: string | null;
  scheduled_at: string;
  duration: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  feedback?: string | null;
  candidate?: HRCandidateBrief | null;
  job?: Pick<HRJob, "id" | "title" | "department"> | null;
};

export type HRProfile = {
  id?: number;
  company_name: string;
  designation?: string | null;
  department?: string | null;
  company_logo?: string | null;
  company_website?: string | null;
  industry?: string | null;
  company_size?: string | null;
  company_description?: string | null;
  office_location?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  verified?: boolean;
  status?: string;
};

export type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

async function hrFetch<T>(path: string, init?: RequestInit) {
  return apiFetch<ApiSuccess<T>>(`/api/hr${path}`, init);
}

export const hrService = {
  dashboard: () => hrFetch<any>("/dashboard"),

  listJobs: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    const q = qs.toString();
    return hrFetch<Paginated<HRJob>>(`/jobs${q ? `?${q}` : ""}`);
  },

  getJob: (id: number) => hrFetch<HRJob>(`/jobs/${id}`),

  createJob: (payload: Partial<HRJob>) =>
    hrFetch<HRJob>("/jobs", { method: "POST", body: JSON.stringify(payload) }),

  updateJob: (id: number, payload: Partial<HRJob>) =>
    hrFetch<HRJob>(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  closeJob: (id: number) => hrFetch<HRJob>(`/jobs/${id}/close`, { method: "POST" }),

  deleteJob: (id: number) => hrFetch<null>(`/jobs/${id}`, { method: "DELETE" }),

  listApplications: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    const q = qs.toString();
    return hrFetch<Paginated<HRApplication>>(`/applications${q ? `?${q}` : ""}`);
  },

  getApplication: (id: number) => hrFetch<HRApplication>(`/applications/${id}`),

  updateApplication: (id: number, payload: Partial<HRApplication>) =>
    hrFetch<HRApplication>(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  bulkUpdateApplications: (payload: {
    ids: number[];
    current_stage?: string;
    rating?: number;
  }) =>
    hrFetch<{ updated: number }>("/applications/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listCandidates: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    const q = qs.toString();
    return hrFetch<Paginated<any>>(`/candidates${q ? `?${q}` : ""}`);
  },

  getCandidate: (id: number) => hrFetch<any>(`/candidates/${id}`),

  addCandidateNote: (id: number, note: string) =>
    hrFetch<any>(`/candidates/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  deleteCandidateNote: (candidateId: number, noteId: number) =>
    hrFetch<null>(`/candidates/${candidateId}/notes/${noteId}`, { method: "DELETE" }),

  listInterviews: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    const q = qs.toString();
    return hrFetch<Paginated<HRInterview>>(`/interviews${q ? `?${q}` : ""}`);
  },

  createInterview: (payload: Partial<HRInterview> & { application_id: number; scheduled_at: string }) =>
    hrFetch<HRInterview>("/interviews", { method: "POST", body: JSON.stringify(payload) }),

  updateInterview: (id: number, payload: Partial<HRInterview>) =>
    hrFetch<HRInterview>(`/interviews/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteInterview: (id: number) =>
    hrFetch<null>(`/interviews/${id}`, { method: "DELETE" }),

  pipeline: (jobId?: number) =>
    hrFetch<any>(`/pipeline${jobId ? `?job_id=${jobId}` : ""}`),

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

  notifications: () =>
    hrFetch<{ notifications: any[]; unread_count: number }>("/notifications"),

  markNotificationRead: (id: number) =>
    hrFetch<any>(`/notifications/${id}/read`, { method: "POST" }),

  markAllNotificationsRead: () =>
    hrFetch<null>("/notifications/read-all", { method: "POST" }),

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
};

export const PIPELINE_STAGES = [
  "applied",
  "screening",
  "technical",
  "hr",
  "final",
  "offer",
  "joined",
  "rejected",
] as const;

export function stageLabel(stage: string) {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}
