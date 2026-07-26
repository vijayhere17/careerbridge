import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Compass,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/components/recruiter/shared";
import { apiFetch, clearAuth, getAuthToken, getStoredUser } from "@/lib/auth";
import {
  RECRUITER_TYPE_OPTIONS,
  onboardingRedirectPath,
  recruiterOnboardingService,
  type RecruiterCompanyProfile,
  type RecruiterOnboardingStatus,
  type RecruiterType,
} from "@/services/recruiterOnboardingService";

type UiStep = "verification" | "profile" | "type" | "pending" | "rejected" | "changes_requested" | "suspended";

const PROFILE_SECTIONS = ["Company", "Contact", "Address", "Social & Legal"] as const;

const INDUSTRIES = [
  "Information Technology",
  "Software Development",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
  "Other",
];

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

type ProfileForm = {
  company_name: string;
  recruiter_name: string;
  designation: string;
  about_company: string;
  company_description: string;
  industry: string;
  company_size: string;
  website: string;
  email: string;
  phone: string;
  office_address: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  twitter: string;
  company_registration_number: string;
  gst_number: string;
};

function emptyForm(userName?: string, email?: string, mobile?: string | null): ProfileForm {
  return {
    company_name: "",
    recruiter_name: userName ?? "",
    designation: "",
    about_company: "",
    company_description: "",
    industry: "",
    company_size: "",
    website: "",
    email: email ?? "",
    phone: mobile ?? "",
    office_address: "",
    city: "",
    state: "",
    country: "India",
    pin_code: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    twitter: "",
    company_registration_number: "",
    gst_number: "",
  };
}

function fromProfile(profile?: RecruiterCompanyProfile | null, fallback?: ProfileForm): ProfileForm {
  const base = fallback ?? emptyForm();
  if (!profile) return base;
  return {
    company_name: profile.company_name ?? base.company_name,
    recruiter_name: profile.recruiter_name ?? base.recruiter_name,
    designation: profile.designation ?? base.designation,
    about_company: profile.about_company ?? base.about_company,
    company_description: profile.company_description ?? base.company_description,
    industry: profile.industry ?? base.industry,
    company_size: profile.company_size ?? base.company_size,
    website: profile.website ?? base.website,
    email: profile.email ?? base.email,
    phone: profile.phone ?? base.phone,
    office_address: profile.office_address ?? base.office_address,
    city: profile.city ?? base.city,
    state: profile.state ?? base.state,
    country: profile.country ?? base.country,
    pin_code: profile.pin_code ?? base.pin_code,
    linkedin: profile.linkedin ?? base.linkedin,
    facebook: profile.facebook ?? base.facebook,
    instagram: profile.instagram ?? base.instagram,
    twitter: profile.twitter ?? base.twitter,
    company_registration_number:
      profile.company_registration_number ?? base.company_registration_number,
    gst_number: profile.gst_number ?? base.gst_number,
  };
}

function BrandHeader() {
  return (
    <Link to="/" className="inline-flex items-center gap-2 font-display font-bold text-base">
      <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
        <Compass className="h-4 w-4" />
      </span>
      <span>
        Career <span className="text-primary">Bridge</span>
      </span>
    </Link>
  );
}

function StepBar({ current }: { current: number }) {
  const labels = ["Verify", "Profile", "Type", "Approval"];
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
          Recruiter onboarding
        </p>
        <p className="text-[11px] font-medium text-muted-foreground">
          {labels[Math.min(current, labels.length - 1)]}
        </p>
      </div>
      <div className="flex gap-1.5">
        {labels.map((label, i) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < current ? "bg-primary" : i === current ? "gradient-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function resolveUiStep(status: RecruiterOnboardingStatus, queryStep?: string | null): UiStep {
  if (queryStep === "suspended" || status.next_step === "suspended") return "suspended";
  if (queryStep === "rejected" || status.next_step === "rejected") return "rejected";
  if (queryStep === "changes" || status.next_step === "changes_requested") return "changes_requested";
  if (queryStep === "pending" || status.next_step === "pending_approval") return "pending";
  if (queryStep === "type" || status.next_step === "type") return "type";
  if (queryStep === "profile" || status.next_step === "profile") return "profile";
  if (status.next_step === "complete") return "pending";
  return "verification";
}

function stepIndex(step: UiStep): number {
  switch (step) {
    case "verification":
      return 0;
    case "profile":
      return 1;
    case "type":
      return 2;
    case "pending":
    case "rejected":
    case "changes_requested":
    case "suspended":
      return 3;
  }
}

function normalizeStatus(next: RecruiterOnboardingStatus): RecruiterOnboardingStatus {
  const verifiedEmail = Boolean(next.verified_email);
  const verifiedMobile = Boolean(next.verified_mobile);
  const verificationComplete =
    Boolean(next.verification_complete) || (verifiedEmail && verifiedMobile);

  return {
    ...next,
    verified_email: verifiedEmail,
    verified_mobile: verifiedMobile,
    verification_complete: verificationComplete,
    profile_complete: Boolean(next.profile_complete),
    type_selected: Boolean(next.type_selected),
    can_access_dashboard: Boolean(next.can_access_dashboard),
    can_post_opportunities: Boolean(next.can_post_opportunities),
  };
}

export function RecruiterOnboardingPage() {
  const router = useRouter();
  const user = getStoredUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<RecruiterOnboardingStatus | null>(null);
  const [uiStep, setUiStep] = useState<UiStep>("verification");
  const [profileSection, setProfileSection] = useState(0);
  const [form, setForm] = useState<ProfileForm>(() =>
    emptyForm(user?.name, user?.email, user?.mobile),
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [devEmailOtp, setDevEmailOtp] = useState("");
  const [devMobileOtp, setDevMobileOtp] = useState("");
  const [selectedType, setSelectedType] = useState<RecruiterType | null>(null);
  const loadSeq = useRef(0);

  const queryStep = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("step");
  }, []);

  const applyStatus = (raw: RecruiterOnboardingStatus) => {
    const next = normalizeStatus(raw);
    setStatus(next);
    setForm((prev) => fromProfile(next.profile, prev));
    setLogoPreview(next.profile?.company_logo ?? null);
    if (next.recruiter_type) setSelectedType(next.recruiter_type as RecruiterType);

    if (next.can_access_dashboard) {
      router.navigate({ to: "/recruiter" });
      return;
    }

    setUiStep(resolveUiStep(next, queryStep));
  };

  const refreshStatus = async () => {
    const res = await recruiterOnboardingService.status();
    applyStatus(res.data);
    return res.data;
  };

  const load = async () => {
    const token = getAuthToken();
    if (!token) {
      router.navigate({ to: "/login" });
      return;
    }

    const seq = ++loadSeq.current;
    setLoading(true);
    setError("");
    try {
      const auth = await apiFetch<{
        user: { role: string };
        recruiter_onboarding?: RecruiterOnboardingStatus | null;
      }>("/api/auth/user");

      if (seq !== loadSeq.current) return;

      if (auth.user.role !== "opportunity_provider") {
        router.navigate({ to: "/dashboard" });
        return;
      }

      const res = await recruiterOnboardingService.status();
      if (seq !== loadSeq.current) return;
      applyStatus(res.data);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(apiErrorMessage(err, "Could not load onboarding status."));
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField =
    (key: keyof ProfileForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const sendEmailOtp = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await recruiterOnboardingService.sendEmailOtp();
      setDevEmailOtp(res.data?.dev_otp ?? "");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not send email OTP."));
    } finally {
      setSaving(false);
    }
  };

  const verifyEmail = async () => {
    if (emailOtp.length < 6) {
      setError("Enter the 6-digit email OTP.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Invalidate any in-flight status loads so a stale response cannot undo verification.
      loadSeq.current += 1;
      const res = await recruiterOnboardingService.verifyEmail(emailOtp);
      applyStatus(res.data);
      setEmailOtp("");
      setDevEmailOtp("");
      try {
        await refreshStatus();
      } catch {
        /* keep verify response */
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Email OTP is invalid or expired."));
    } finally {
      setSaving(false);
    }
  };

  const sendMobileOtp = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await recruiterOnboardingService.sendMobileOtp();
      setDevMobileOtp(res.data?.dev_otp ?? "");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not send mobile OTP."));
    } finally {
      setSaving(false);
    }
  };

  const verifyMobile = async () => {
    if (mobileOtp.length < 6) {
      setError("Enter the 6-digit mobile OTP.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Invalidate any in-flight status loads so a stale response cannot undo verification.
      loadSeq.current += 1;
      const res = await recruiterOnboardingService.verifyMobile(mobileOtp);
      applyStatus(res.data);
      setMobileOtp("");
      setDevMobileOtp("");
      try {
        await refreshStatus();
      } catch {
        /* keep verify response */
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Mobile OTP is invalid or expired."));
    } finally {
      setSaving(false);
    }
  };

  const buildProfileFormData = (saveAndContinue: boolean) => {
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => fd.append(key, value ?? ""));
    fd.append("save_and_continue", saveAndContinue ? "1" : "0");
    if (logoFile) fd.append("company_logo", logoFile);
    return fd;
  };

  const saveProfile = async (saveAndContinue: boolean) => {
    setSaving(true);
    setError("");
    try {
      const res = await recruiterOnboardingService.saveProfile(buildProfileFormData(saveAndContinue));
      applyStatus(res.data.onboarding);
      if (saveAndContinue && res.data.onboarding.profile_complete) {
        setUiStep("type");
      } else if (!saveAndContinue && profileSection < PROFILE_SECTIONS.length - 1) {
        setProfileSection((s) => s + 1);
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save recruiter profile."));
    } finally {
      setSaving(false);
    }
  };

  const submitType = async () => {
    if (!selectedType) {
      setError("Select a recruiter type to continue.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await recruiterOnboardingService.selectType(selectedType);
      applyStatus(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save recruiter type."));
    } finally {
      setSaving(false);
    }
  };

  const resubmit = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await recruiterOnboardingService.resubmit();
      applyStatus(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not resubmit profile."));
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    clearAuth();
    window.location.href = "/login";
  };

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <BrandHeader />
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-8 shadow-sm">
          <StepBar current={stepIndex(uiStep)} />

          {status && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Profile completion</p>
              <p className="text-sm font-semibold text-primary">{status.profile_completion ?? 0}%</p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {uiStep === "verification" && status && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Verify your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirm email and mobile before completing your recruiter profile.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Email verification</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    {status.verified_email ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : null}
                  </div>
                  {!status.verified_email && (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" disabled={saving} onClick={sendEmailOtp}>
                          Send OTP
                        </Button>
                      </div>
                      {devEmailOtp && (
                        <p className="text-xs text-muted-foreground">
                          Dev OTP: <span className="font-semibold text-primary">{devEmailOtp}</span>
                        </p>
                      )}
                      <Input
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit OTP"
                        inputMode="numeric"
                      />
                      <Button type="button" variant="brand" disabled={saving} onClick={verifyEmail}>
                        Verify Email
                      </Button>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Mobile OTP verification</p>
                        <p className="text-xs text-muted-foreground">{user?.mobile || "Add mobile on profile"}</p>
                      </div>
                    </div>
                    {status.verified_mobile ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : null}
                  </div>
                  {!status.verified_mobile && (
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" disabled={saving} onClick={sendMobileOtp}>
                          Send OTP
                        </Button>
                      </div>
                      {devMobileOtp && (
                        <p className="text-xs text-muted-foreground">
                          Dev OTP: <span className="font-semibold text-primary">{devMobileOtp}</span>
                        </p>
                      )}
                      <Input
                        value={mobileOtp}
                        onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit OTP"
                        inputMode="numeric"
                      />
                      <Button type="button" variant="brand" disabled={saving} onClick={verifyMobile}>
                        Verify Mobile
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="brand"
                className="w-full"
                disabled={!status.verification_complete || saving}
                onClick={() => setUiStep("profile")}
              >
                Continue to profile <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {uiStep === "profile" && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Complete recruiter profile</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Section {profileSection + 1} of {PROFILE_SECTIONS.length}: {PROFILE_SECTIONS[profileSection]}
                </p>
              </div>

              <div className="flex gap-1.5">
                {PROFILE_SECTIONS.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setProfileSection(i)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                      i === profileSection
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {profileSection === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label>Company logo</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-border bg-muted">
                        {logoPreview ? (
                          <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
                        <Upload className="h-4 w-4" /> Upload logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            setLogoFile(file);
                            setLogoPreview(file ? URL.createObjectURL(file) : status?.profile?.company_logo ?? null);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Company name *</Label>
                      <Input className="mt-1.5" value={form.company_name} onChange={updateField("company_name")} />
                    </div>
                    <div>
                      <Label>Recruiter name *</Label>
                      <Input className="mt-1.5" value={form.recruiter_name} onChange={updateField("recruiter_name")} />
                    </div>
                    <div>
                      <Label>Designation *</Label>
                      <Input className="mt-1.5" value={form.designation} onChange={updateField("designation")} />
                    </div>
                    <div>
                      <Label>Industry *</Label>
                      <select className="auth-input mt-1.5 w-full" value={form.industry} onChange={updateField("industry")}>
                        <option value="">Select industry</option>
                        {INDUSTRIES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Company size *</Label>
                      <select
                        className="auth-input mt-1.5 w-full"
                        value={form.company_size}
                        onChange={updateField("company_size")}
                      >
                        <option value="">Select size</option>
                        {COMPANY_SIZES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Website *</Label>
                      <Input className="mt-1.5" value={form.website} onChange={updateField("website")} placeholder="https://" />
                    </div>
                  </div>
                  <div>
                    <Label>About company *</Label>
                    <Textarea className="mt-1.5" rows={3} value={form.about_company} onChange={updateField("about_company")} />
                  </div>
                  <div>
                    <Label>Company description *</Label>
                    <Textarea
                      className="mt-1.5"
                      rows={4}
                      value={form.company_description}
                      onChange={updateField("company_description")}
                    />
                  </div>
                </div>
              )}

              {profileSection === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Email *</Label>
                    <Input className="mt-1.5" type="email" value={form.email} onChange={updateField("email")} />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input className="mt-1.5" value={form.phone} onChange={updateField("phone")} />
                  </div>
                </div>
              )}

              {profileSection === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Office address *</Label>
                    <Textarea className="mt-1.5" rows={2} value={form.office_address} onChange={updateField("office_address")} />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <Input className="mt-1.5" value={form.city} onChange={updateField("city")} />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input className="mt-1.5" value={form.state} onChange={updateField("state")} />
                  </div>
                  <div>
                    <Label>Country *</Label>
                    <Input className="mt-1.5" value={form.country} onChange={updateField("country")} />
                  </div>
                  <div>
                    <Label>PIN code *</Label>
                    <Input className="mt-1.5" value={form.pin_code} onChange={updateField("pin_code")} />
                  </div>
                </div>
              )}

              {profileSection === 3 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>LinkedIn *</Label>
                    <Input className="mt-1.5" value={form.linkedin} onChange={updateField("linkedin")} />
                  </div>
                  <div>
                    <Label>Facebook</Label>
                    <Input className="mt-1.5" value={form.facebook} onChange={updateField("facebook")} />
                  </div>
                  <div>
                    <Label>Instagram</Label>
                    <Input className="mt-1.5" value={form.instagram} onChange={updateField("instagram")} />
                  </div>
                  <div>
                    <Label>Twitter</Label>
                    <Input className="mt-1.5" value={form.twitter} onChange={updateField("twitter")} />
                  </div>
                  <div>
                    <Label>Company registration number *</Label>
                    <Input
                      className="mt-1.5"
                      value={form.company_registration_number}
                      onChange={updateField("company_registration_number")}
                    />
                  </div>
                  <div>
                    <Label>GST number (optional)</Label>
                    <Input className="mt-1.5" value={form.gst_number} onChange={updateField("gst_number")} />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || (profileSection === 0 && uiStep === "profile")}
                  onClick={() => {
                    if (profileSection > 0) setProfileSection((s) => s - 1);
                    else setUiStep("verification");
                  }}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <Button type="button" variant="outline" disabled={saving} onClick={() => saveProfile(false)}>
                  {saving ? "Saving…" : "Save & Continue"}
                </Button>
                {profileSection === PROFILE_SECTIONS.length - 1 && (
                  <Button type="button" variant="brand" disabled={saving} onClick={() => saveProfile(true)}>
                    {saving ? "Submitting…" : "Complete profile"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {uiStep === "type" && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Choose recruiter type</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Future dashboards can adapt based on how you hire.
                </p>
              </div>

              <div className="space-y-2">
                {RECRUITER_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedType(option.value)}
                    className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${
                      selectedType === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p className="text-sm font-semibold">{option.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setUiStep("profile")}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <Button type="button" variant="brand" className="flex-1" disabled={saving || !selectedType} onClick={submitType}>
                  {saving ? "Saving…" : "Submit for approval"}
                </Button>
              </div>
            </div>
          )}

          {uiStep === "pending" && status && (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
                <Clock3 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Waiting for admin approval</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your recruiter profile is under review. Dashboard access unlocks after approval.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-left text-sm">
                <p>
                  Status: <span className="font-semibold">{status.approval_status}</span>
                </p>
                <p className="mt-1 text-muted-foreground">
                  Type: {(status.recruiter_type || "—").replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" disabled={saving} onClick={load}>
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Check status
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUiStep("profile");
                    setProfileSection(0);
                  }}
                >
                  Edit profile
                </Button>
              </div>
            </div>
          )}

          {uiStep === "rejected" && status && (
            <div className="space-y-5">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold tracking-tight">Profile rejected</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Update your profile based on admin feedback and resubmit. Dashboard access stays locked until approval.
                </p>
              </div>
              {(status.rejection_reason || status.admin_remarks) && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
                  <p className="font-semibold text-destructive">Reason</p>
                  <p className="mt-1 text-muted-foreground">{status.rejection_reason || status.admin_remarks}</p>
                </div>
              )}
              {status.required_changes && (
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
                  <p className="font-semibold">Required changes</p>
                  <p className="mt-1 text-muted-foreground">{status.required_changes}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUiStep("profile");
                    setProfileSection(0);
                  }}
                >
                  Edit profile
                </Button>
                <Button type="button" variant="brand" disabled={saving} onClick={resubmit}>
                  {saving ? "Resubmitting…" : "Resubmit for approval"}
                </Button>
              </div>
            </div>
          )}

          {uiStep === "changes_requested" && status && (
            <div className="space-y-5">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10">
                <AlertTriangle className="h-7 w-7 text-amber-600" />
              </div>
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold tracking-tight">Changes requested</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  An admin asked for updates before approval. Edit your profile and resubmit.
                </p>
              </div>
              {(status.rejection_reason || status.admin_remarks) && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
                  <p className="font-semibold text-amber-700 dark:text-amber-300">Reason</p>
                  <p className="mt-1 text-muted-foreground">{status.rejection_reason || status.admin_remarks}</p>
                </div>
              )}
              {status.required_changes && (
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
                  <p className="font-semibold">Required changes</p>
                  <p className="mt-1 text-muted-foreground">{status.required_changes}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUiStep("profile");
                    setProfileSection(0);
                  }}
                >
                  Edit profile
                </Button>
                <Button type="button" variant="brand" disabled={saving} onClick={resubmit}>
                  {saving ? "Resubmitting…" : "Resubmit for approval"}
                </Button>
              </div>
            </div>
          )}

          {uiStep === "suspended" && status && (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-500/10">
                <AlertTriangle className="h-7 w-7 text-slate-600" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Account suspended</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your recruiter account is suspended. Dashboard access is unavailable until an admin reactivates it.
                </p>
              </div>
              {(status.admin_remarks || status.rejection_reason) && (
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-left text-sm">
                  <p className="font-semibold">Admin note</p>
                  <p className="mt-1 text-muted-foreground">{status.admin_remarks || status.rejection_reason}</p>
                </div>
              )}
              <Button type="button" variant="outline" disabled={saving} onClick={load}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> Check status
              </Button>
            </div>
          )}

          {status?.can_access_dashboard && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
              <ShieldCheck className="h-4 w-4" />
              Onboarding complete — redirecting to dashboard…
            </div>
          )}
        </div>

        {status && !status.can_access_dashboard && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Current step: {onboardingRedirectPath(status).replace("/recruiter/onboarding", "onboarding")}
          </p>
        )}
      </div>
    </div>
  );
}
