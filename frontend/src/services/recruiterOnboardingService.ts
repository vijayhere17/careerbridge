import { apiFetch } from "@/lib/auth";

export type RecruiterType =
  | "company_recruiter"
  | "hr_agency"
  | "startup"
  | "consultancy"
  | "individual_recruiter";

export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

export type RecruiterOnboardingStep =
  | "verification"
  | "profile"
  | "type"
  | "pending_approval"
  | "rejected"
  | "complete";

export type RecruiterCompanyProfile = {
  id?: number;
  user_id?: number;
  company_name?: string | null;
  company_logo?: string | null;
  cover_image?: string | null;
  recruiter_name?: string | null;
  designation?: string | null;
  about_company?: string | null;
  company_description?: string | null;
  industry?: string | null;
  company_size?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  office_address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pin_code?: string | null;
  linkedin?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  company_registration_number?: string | null;
  gst_number?: string | null;
  recruiter_type?: RecruiterType | string | null;
  approval_status?: ApprovalStatus | string | null;
  admin_remarks?: string | null;
  profile_completion?: number;
  onboarding_step?: RecruiterOnboardingStep | string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
};

export type RecruiterOnboardingStatus = {
  role: string;
  verified_email: boolean;
  verified_mobile: boolean;
  verification_complete: boolean;
  profile_complete: boolean;
  type_selected: boolean;
  recruiter_type?: RecruiterType | string | null;
  approval_status: ApprovalStatus | string;
  admin_remarks?: string | null;
  require_admin_approval: boolean;
  profile_completion: number;
  onboarding_step: RecruiterOnboardingStep | string;
  next_step: RecruiterOnboardingStep | string;
  can_access_dashboard: boolean;
  can_post_opportunities: boolean;
  available_types: RecruiterType[] | string[];
  profile: RecruiterCompanyProfile;
};

type ApiSuccess<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export const RECRUITER_TYPE_OPTIONS: { value: RecruiterType; label: string; description: string }[] = [
  {
    value: "company_recruiter",
    label: "Company Recruiter",
    description: "Hire for your own company roles and campus drives.",
  },
  {
    value: "hr_agency",
    label: "HR Agency",
    description: "Recruit on behalf of multiple client organizations.",
  },
  {
    value: "startup",
    label: "Startup",
    description: "Build early teams for a growing startup.",
  },
  {
    value: "consultancy",
    label: "Consultancy",
    description: "Place talent through consulting engagements.",
  },
  {
    value: "individual_recruiter",
    label: "Individual Recruiter",
    description: "Independent recruiter posting opportunities directly.",
  },
];

export function onboardingRedirectPath(status?: RecruiterOnboardingStatus | null): "/recruiter" | "/recruiter/onboarding" {
  if (!status) return "/recruiter/onboarding";
  return status.can_access_dashboard ? "/recruiter" : "/recruiter/onboarding";
}

export const recruiterOnboardingService = {
  status() {
    return apiFetch<ApiSuccess<RecruiterOnboardingStatus>>("/api/recruiter/onboarding/status");
  },

  sendEmailOtp() {
    return apiFetch<ApiSuccess<{ dev_otp?: string }>>("/api/recruiter/onboarding/email/send-otp", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  verifyEmail(otp: string) {
    return apiFetch<ApiSuccess<RecruiterOnboardingStatus>>("/api/recruiter/onboarding/email/verify", {
      method: "POST",
      body: JSON.stringify({ otp }),
    });
  },

  sendMobileOtp() {
    return apiFetch<ApiSuccess<{ dev_otp?: string }>>("/api/recruiter/onboarding/mobile/send-otp", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  verifyMobile(otp: string) {
    return apiFetch<ApiSuccess<RecruiterOnboardingStatus>>("/api/recruiter/onboarding/mobile/verify", {
      method: "POST",
      body: JSON.stringify({ otp }),
    });
  },

  getProfile() {
    return apiFetch<
      ApiSuccess<{ onboarding: RecruiterOnboardingStatus; profile: RecruiterCompanyProfile }>
    >("/api/recruiter/onboarding/profile");
  },

  saveProfile(form: FormData) {
    return apiFetch<
      ApiSuccess<{ onboarding: RecruiterOnboardingStatus; profile: RecruiterCompanyProfile }>
    >("/api/recruiter/onboarding/profile", {
      method: "POST",
      body: form,
    });
  },

  selectType(recruiter_type: RecruiterType) {
    return apiFetch<ApiSuccess<RecruiterOnboardingStatus>>("/api/recruiter/onboarding/type", {
      method: "POST",
      body: JSON.stringify({ recruiter_type }),
    });
  },

  resubmit() {
    return apiFetch<ApiSuccess<RecruiterOnboardingStatus>>("/api/recruiter/onboarding/resubmit", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
