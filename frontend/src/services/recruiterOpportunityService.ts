import { apiFetch } from "@/lib/auth";

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type RecruiterOpportunity = {
  id: number;
  opportunity_type: string;
  title: string;
  company_name: string;
  location?: string | null;
  employment_type?: string | null;
  experience_level?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  application_deadline?: string | null;
  skills?: string | null;
  description?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  work_mode?: "Remote" | "Hybrid" | "Office" | string | null;
  contact_visibility?: "public" | "locked" | string | null;
  contact_price?: number | null;
  status: "draft" | "published" | "closed" | "archived" | "paused" | string;
  views?: number;
  applications_count?: number;
  unlocks_count?: number;
  published_at?: string | null;
  closed_at?: string | null;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RecruiterApplication = {
  id: number;
  recruiter_opportunity_id: number;
  candidate_id: number;
  status: string;
  status_label?: string;
  rating?: number | null;
  resume_url?: string | null;
  message?: string | null;
  recruiter_notes?: string | null;
  reject_reason?: string | null;
  info_request?: string | null;
  expected_salary?: number | null;
  interview_status?: string | null;
  interview_at?: string | null;
  interview_link?: string | null;
  applied_at?: string | null;
  contact_unlocked?: boolean;
  contact_price?: number | null;
  profile_strength?: number;
  candidate?: {
    id: number;
    name: string;
    email?: string | null;
    mobile?: string | null;
    location?: string | null;
    experience?: string | null;
    skills?: string[] | string | null;
    photo?: string | null;
    profile_photo?: string | null;
    resume_url?: string | null;
    headline?: string | null;
    education?: string | null;
    bio?: string | null;
    linkedin?: string | null;
    github?: string | null;
    portfolio?: string | null;
    contact_unlocked?: boolean;
  } | null;
  opportunity?: {
    id: number;
    title: string;
    opportunity_type?: string;
    location?: string | null;
  } | null;
};

export type RecruiterNotification = {
  id: number;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  data?: Record<string, unknown> | unknown[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type RecruiterApiRecord = Record<string, unknown>;

export type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
};

function qs(params: Record<string, string | number | boolean | undefined> = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) search.set(k, String(v));
  });
  const q = search.toString();
  return q ? `?${q}` : "";
}

async function recruiterFetch<T>(path: string, init?: RequestInit) {
  return apiFetch<ApiSuccess<T>>(`/api/recruiter${path}`, init);
}

export const recruiterService = {
  dashboard: () => recruiterFetch<RecruiterApiRecord>("/dashboard"),

  listOpportunities: (params: Record<string, string | number | undefined> = {}) =>
    recruiterFetch<Paginated<RecruiterOpportunity> | RecruiterOpportunity[]>(
      `/opportunities${qs(params)}`,
    ),

  opportunitySummary: () => recruiterFetch<RecruiterApiRecord>("/opportunities/summary"),

  getOpportunity: (id: number) => recruiterFetch<RecruiterOpportunity>(`/opportunities/${id}`),

  publishOpportunity: (payload: Partial<RecruiterOpportunity>) =>
    recruiterFetch<RecruiterOpportunity>("/opportunities", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  saveDraft: (payload: Partial<RecruiterOpportunity>) =>
    recruiterFetch<RecruiterOpportunity>("/opportunities/save-draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateOpportunity: (id: number, payload: Partial<RecruiterOpportunity>) =>
    recruiterFetch<RecruiterOpportunity>(`/opportunities/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteOpportunity: (id: number) =>
    recruiterFetch<null>(`/opportunities/${id}`, { method: "DELETE" }),

  closeOpportunity: (id: number) =>
    recruiterFetch<RecruiterOpportunity>(`/opportunities/${id}/close`, { method: "POST" }),
  publishExisting: (id: number) =>
    recruiterFetch<RecruiterOpportunity>(`/opportunities/${id}/publish`, { method: "POST" }),
  draftOpportunity: (id: number) =>
    recruiterFetch<RecruiterOpportunity>(`/opportunities/${id}/draft`, { method: "POST" }),
  archiveOpportunity: (id: number) =>
    recruiterFetch<RecruiterOpportunity>(`/opportunities/${id}/archive`, { method: "POST" }),
  pauseOpportunity: (id: number) =>
    recruiterFetch<RecruiterOpportunity>(`/opportunities/${id}/pause`, { method: "POST" }),
  reopenOpportunity: (id: number) =>
    recruiterFetch<RecruiterOpportunity>(`/opportunities/${id}/reopen`, { method: "POST" }),
  duplicateOpportunity: (id: number) =>
    recruiterFetch<RecruiterOpportunity>(`/opportunities/${id}/duplicate`, { method: "POST" }),

  bulkOpportunities: (payload: { ids: number[]; action: string }) =>
    recruiterFetch<{ updated: number }>("/opportunities/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listApplications: (params: Record<string, string | number | undefined> = {}) =>
    recruiterFetch<Paginated<RecruiterApplication>>(`/applications${qs(params)}`),

  getApplication: (id: number) => recruiterFetch<RecruiterApplication>(`/applications/${id}`),

  updateApplication: (id: number, payload: Partial<RecruiterApplication>) =>
    recruiterFetch<RecruiterApplication>(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  shortlistApplication: (id: number) =>
    recruiterFetch<RecruiterApplication>(`/applications/${id}/shortlist`, { method: "POST" }),

  rejectApplication: (id: number, reason?: string) =>
    recruiterFetch<RecruiterApplication>(`/applications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  hireApplication: (id: number) =>
    recruiterFetch<RecruiterApplication>(`/applications/${id}/hire`, { method: "POST" }),

  underReviewApplication: (id: number) =>
    recruiterFetch<RecruiterApplication>(`/applications/${id}/under-review`, { method: "POST" }),

  acceptApplication: (id: number) =>
    recruiterFetch<RecruiterApplication>(`/applications/${id}/accept`, { method: "POST" }),

  completeInterview: (id: number) =>
    recruiterFetch<RecruiterApplication>(`/applications/${id}/complete-interview`, {
      method: "POST",
    }),

  completeApplication: (id: number) =>
    recruiterFetch<RecruiterApplication>(`/applications/${id}/complete`, { method: "POST" }),

  requestApplicationInfo: (id: number, message: string) =>
    recruiterFetch<RecruiterApplication>(`/applications/${id}/request-info`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),

  scheduleInterview: (
    id: number,
    payload: { interview_at: string; interview_link?: string; interview_status?: string },
  ) =>
    recruiterFetch<RecruiterApplication>(`/applications/${id}/schedule-interview`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  applicationTimeline: (id: number) =>
    recruiterFetch<{ timeline: RecruiterApiRecord[] }>(`/applications/${id}/timeline`),

  applicationMessages: (id: number) =>
    recruiterFetch<{
      application_id: number;
      messages: RecruiterApiRecord[];
      unread_count: number;
    }>(`/applications/${id}/messages`),

  conversations: (params: Record<string, string | number | boolean | undefined> = {}) =>
    recruiterFetch<{
      conversations: RecruiterApiRecord[];
      pagination?: {
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
      };
      unread_count?: number;
    }>(`/messages${qs(params)}`),

  sendApplicationMessage: (id: number, body?: string, attachment?: File | null) => {
    if (attachment) {
      const form = new FormData();
      if (body?.trim()) form.append("body", body.trim());
      form.append("attachment", attachment);
      return recruiterFetch<RecruiterApiRecord>(`/applications/${id}/messages`, {
        method: "POST",
        body: form,
      });
    }

    return recruiterFetch<RecruiterApiRecord>(`/applications/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: body ?? "" }),
    });
  },

  unlockCandidateContact: (recruiter_application_id: number) =>
    recruiterFetch<RecruiterApiRecord>("/unlocks", {
      method: "POST",
      body: JSON.stringify({ recruiter_application_id }),
    }),

  bulkApplications: (payload: {
    ids: number[];
    action?: string;
    status?: string;
    notes?: string;
    recruiter_notes?: string;
    interview_at?: string;
    interview_link?: string;
  }) =>
    recruiterFetch<{ updated: number }>("/applications/bulk", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  notifications: (params: Record<string, string | number | boolean | undefined> = {}) =>
    recruiterFetch<{
      notifications: Paginated<RecruiterNotification> | RecruiterNotification[];
      unread_count: number;
    }>(`/notifications${qs(params)}`),

  unreadNotifications: () =>
    recruiterFetch<{ unread_count: number }>("/notifications/unread-count"),

  markNotificationRead: (id: number) =>
    recruiterFetch<RecruiterNotification>(`/notifications/${id}/read`, { method: "POST" }),

  markAllNotificationsRead: () =>
    recruiterFetch<null>("/notifications/read-all", { method: "POST" }),

  deleteNotification: (id: number) =>
    recruiterFetch<null>(`/notifications/${id}`, { method: "DELETE" }),

  wallet: () => recruiterFetch<RecruiterApiRecord>("/wallet"),

  walletTransactions: (params: Record<string, string | number | undefined> = {}) =>
    recruiterFetch<Paginated<RecruiterApiRecord> | RecruiterApiRecord[]>(
      `/wallet/transactions${qs(params)}`,
    ),

  unlocks: (params: Record<string, string | number | undefined> = {}) =>
    recruiterFetch<Paginated<RecruiterApiRecord>>(`/unlocks${qs(params)}`),

  unlockStats: () => recruiterFetch<RecruiterApiRecord>("/unlocks/stats"),

  unlockChart: (params: Record<string, string | number | undefined> = {}) =>
    recruiterFetch<{ days?: number; chart?: RecruiterApiRecord[] } | RecruiterApiRecord[]>(
      `/unlocks/chart${qs(params)}`,
    ),

  withdrawSummary: (params: Record<string, string | number | undefined> = {}) =>
    recruiterFetch<RecruiterApiRecord>(`/withdraw${qs(params)}`),

  requestWithdraw: (payload: {
    amount: number;
    bank_name: string;
    account_holder: string;
    account_number: string;
    ifsc?: string;
    upi?: string;
    remarks?: string;
  }) =>
    recruiterFetch<RecruiterApiRecord>("/withdraw", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  cancelWithdraw: (id: number) =>
    recruiterFetch<RecruiterApiRecord>(`/withdraw/${id}/cancel`, { method: "POST" }),

  analytics: (params: Record<string, string | number | undefined> = {}) =>
    recruiterFetch<RecruiterApiRecord>(`/analytics${qs(params)}`),

  getSettings: () => recruiterFetch<RecruiterApiRecord>("/settings"),

  updateSettingsProfile: (payload: Record<string, string>) =>
    recruiterFetch<RecruiterApiRecord>("/settings/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  changeEmail: (payload: { email: string; current_password: string }) =>
    recruiterFetch<RecruiterApiRecord>("/settings/email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) =>
    recruiterFetch<null>("/settings/password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updatePreferences: (payload: Record<string, boolean>) =>
    recruiterFetch<RecruiterApiRecord>("/settings/preferences", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updatePayout: (payload: {
    bank_name?: string;
    account_holder?: string;
    account_number?: string;
    ifsc?: string;
    upi?: string;
  }) =>
    recruiterFetch<RecruiterApiRecord>("/settings/payout", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteAccount: (payload: { current_password: string; confirmation: "DELETE" | string }) =>
    recruiterFetch<null>("/settings/delete-account", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** @deprecated use recruiterService */
export const recruiterOpportunityService = {
  getAll: () => recruiterService.listOpportunities(),
  get: (id: number) => recruiterService.getOpportunity(id),
  publish: (data: Partial<RecruiterOpportunity>) => recruiterService.publishOpportunity(data),
  saveDraft: (data: Partial<RecruiterOpportunity>) => recruiterService.saveDraft(data),
  update: (id: number, data: Partial<RecruiterOpportunity>) =>
    recruiterService.updateOpportunity(id, data),
  delete: (id: number) => recruiterService.deleteOpportunity(id),
};
