import { apiFetch } from "@/lib/auth";

export type ApprovalStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "ChangesRequested"
  | "Suspended";

export type AdminReviewAction =
  | "approve"
  | "reject"
  | "request_changes"
  | "suspend"
  | "reactivate"
  | "internal_note";

export type AdminMentorReviewAction =
  | "approve"
  | "reject"
  | "request_changes"
  | "suspend"
  | "activate";

export type AdminRecruiterListItem = {
  user_id: number;
  company_logo?: string | null;
  company_name?: string | null;
  recruiter_name?: string | null;
  email?: string | null;
  phone?: string | null;
  recruiter_type?: string | null;
  industry?: string | null;
  company_size?: string | null;
  location?: string | null;
  registration_date?: string | null;
  profile_completion: number;
  approval_status: ApprovalStatus | string;
  submitted_at?: string | null;
  verified_email?: boolean;
  verified_mobile?: boolean;
};

export type AdminActionHistoryItem = {
  id: number;
  action: string;
  from_status?: string | null;
  to_status?: string | null;
  reason?: string | null;
  notes?: string | null;
  required_changes?: string | null;
  is_internal_note?: boolean;
  admin?: { id: number; name: string; email?: string | null } | null;
  company_name?: string | null;
  recruiter_name?: string | null;
  user_id?: number | null;
  created_at?: string | null;
};

export type AdminRecruiterDetail = {
  user: {
    id: number;
    name: string;
    email: string;
    mobile?: string | null;
    verified_email: boolean;
    verified_mobile: boolean;
    created_at?: string | null;
  };
  profile: Record<string, unknown>;
  onboarding: Record<string, unknown>;
  rejection_reason?: string | null;
  required_changes?: string | null;
  internal_notes?: string | null;
  reviewed_by?: { id: number; name: string; email?: string | null } | null;
  suspended_at?: string | null;
  history: AdminActionHistoryItem[];
};

export type AdminDashboardStats = {
  pending_recruiters: number;
  approved_recruiters: number;
  rejected_recruiters: number;
  changes_requested: number;
  suspended_recruiters: number;
  todays_registrations: number;
  monthly_registrations: number;
  pending_reviews: number;
  recruiters_by_type: Record<string, number>;
  top_industries: { industry: string; total: number }[];
  verification_pending: number;
  recent_activity: AdminActionHistoryItem[];
  totals: { recruiters: number; mentors: number; seekers: number };
};

export type AdminUserListItem = {
  id: number;
  name: string;
  email: string;
  mobile?: string | null;
  created_at?: string | null;
  verified_email?: boolean;
};

export type AdminMentorListItem = AdminUserListItem & {
  onboarding_status?: string | null;
  verified?: boolean;
  available?: boolean;
  company?: string | null;
  designation?: string | null;
  industry?: string | null;
  rating?: number;
  session_count?: number;
};

type ApiSuccess<T> = { success: boolean; message?: string; data: T };

type Paginated<T> = {
  items: T[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type RecruiterListFilters = {
  status?: string;
  type?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort?: "newest" | "oldest";
  page?: number;
  per_page?: number;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") q.set(key, String(value));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const adminService = {
  dashboard() {
    return apiFetch<ApiSuccess<AdminDashboardStats>>("/api/admin/dashboard");
  },

  settings() {
    return apiFetch<ApiSuccess<Record<string, unknown>>>("/api/admin/settings");
  },

  listRecruiters(filters: RecruiterListFilters = {}) {
    return apiFetch<ApiSuccess<Paginated<AdminRecruiterListItem>>>(
      `/api/admin/recruiters${toQuery(filters)}`,
    );
  },

  getRecruiter(userId: number) {
    return apiFetch<ApiSuccess<AdminRecruiterDetail>>(`/api/admin/recruiters/${userId}`);
  },

  history(userId: number) {
    return apiFetch<ApiSuccess<{ history: AdminActionHistoryItem[] }>>(
      `/api/admin/recruiters/${userId}/history`,
    );
  },

  review(
    userId: number,
    body: {
      action: AdminReviewAction;
      approval_status?: ApprovalStatus;
      rejection_reason?: string;
      admin_remarks?: string;
      required_changes?: string;
      internal_notes?: string;
    },
  ) {
    return apiFetch<ApiSuccess<AdminRecruiterDetail>>(`/api/admin/recruiters/${userId}/review`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /** Reuses the legacy onboarding review endpoint as required. */
  reviewLegacy(
    userId: number,
    body: {
      action?: AdminReviewAction;
      approval_status?: ApprovalStatus;
      rejection_reason?: string;
      admin_remarks?: string;
      required_changes?: string;
      internal_notes?: string;
    },
  ) {
    return apiFetch<ApiSuccess<AdminRecruiterDetail>>(
      `/api/recruiter/onboarding/${userId}/review`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },

  listMentors(params: {
    search?: string;
    status?: string;
    page?: number;
    per_page?: number;
  } = {}) {
    return apiFetch<ApiSuccess<Paginated<AdminMentorListItem>>>(
      `/api/admin/mentors${toQuery(params)}`,
    );
  },

  reviewMentor(
    userId: number,
    body: {
      action: AdminMentorReviewAction;
      notes?: string;
      admin_remarks?: string;
      required_changes?: string;
    },
  ) {
    return apiFetch<ApiSuccess<Record<string, unknown>>>(
      `/api/admin/mentors/${userId}/review`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },

  listSeekers(params: { search?: string; page?: number; per_page?: number } = {}) {
    return apiFetch<ApiSuccess<Paginated<AdminUserListItem>>>(
      `/api/admin/job-seekers${toQuery(params)}`,
    );
  },

  listWithdrawals(
    params: { search?: string; status?: string; page?: number; per_page?: number } = {},
  ) {
    return apiFetch<ApiSuccess<Paginated<AdminWithdrawItem>>>(
      `/api/admin/withdrawals${toQuery(params)}`,
    );
  },

  reviewWithdrawal(
    id: number,
    body: { status: "approved" | "rejected"; admin_remarks?: string },
  ) {
    return apiFetch<ApiSuccess<{ id: number; status: string; admin_remarks?: string | null }>>(
      `/api/admin/withdrawals/${id}/review`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  },

  listUnlocks(
    params: { search?: string; status?: string; page?: number; per_page?: number } = {},
  ) {
    return apiFetch<
      ApiSuccess<{
        items: AdminUnlockItem[];
        pagination: Paginated<AdminUnlockItem>["pagination"];
        stats: { total_amount: number; total_count: number };
      }>
    >(`/api/admin/unlocks${toQuery(params)}`);
  },
};

export type AdminWithdrawItem = {
  id: number;
  amount: number;
  status: string;
  bank_name?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  ifsc?: string | null;
  upi?: string | null;
  admin_remarks?: string | null;
  created_at?: string | null;
  processed_at?: string | null;
  user?: {
    id: number;
    name: string;
    email?: string | null;
    role?: string | null;
  } | null;
};

export type AdminUnlockItem = {
  id: number;
  amount: number;
  status: string;
  unlocked_at?: string | null;
  created_at?: string | null;
  recruiter?: { id: number; name: string; email?: string | null } | null;
  candidate?: { id: number; name: string; email?: string | null } | null;
  opportunity?: { id: number; title?: string | null; company_name?: string | null } | null;
};
