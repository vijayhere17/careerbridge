import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Save,
  Upload,
} from "lucide-react";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import {
  RecruiterErrorState,
  RecruiterLoadingSkeleton,
  apiErrorMessage,
} from "@/components/recruiter/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RECRUITER_TYPE_OPTIONS,
  recruiterOnboardingService,
  type RecruiterCompanyProfile,
  type RecruiterOnboardingStatus,
} from "@/services/recruiterOnboardingService";
import { recruiterService } from "@/services/recruiterOpportunityService";

type FormState = {
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
  recruiter_type: string;
};

const EMPTY: FormState = {
  company_name: "",
  recruiter_name: "",
  designation: "",
  about_company: "",
  company_description: "",
  industry: "",
  company_size: "",
  website: "",
  email: "",
  phone: "",
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
  recruiter_type: "",
};

function toForm(profile?: RecruiterCompanyProfile | null): FormState {
  if (!profile) return EMPTY;
  return {
    company_name: profile.company_name ?? "",
    recruiter_name: profile.recruiter_name ?? "",
    designation: profile.designation ?? "",
    about_company: profile.about_company ?? "",
    company_description: profile.company_description ?? "",
    industry: profile.industry ?? "",
    company_size: profile.company_size ?? "",
    website: profile.website ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    office_address: profile.office_address ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    country: profile.country ?? "India",
    pin_code: profile.pin_code ?? "",
    linkedin: profile.linkedin ?? "",
    facebook: profile.facebook ?? "",
    instagram: profile.instagram ?? "",
    twitter: profile.twitter ?? "",
    company_registration_number: profile.company_registration_number ?? "",
    gst_number: profile.gst_number ?? "",
    recruiter_type: (profile.recruiter_type as string) ?? "",
  };
}

export function RecruiterProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [onboarding, setOnboarding] = useState<RecruiterOnboardingStatus | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [openPositions, setOpenPositions] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, summaryRes] = await Promise.all([
        recruiterOnboardingService.getProfile(),
        recruiterService.opportunitySummary().catch(() => null),
      ]);
      setOnboarding(profileRes.data.onboarding);
      setForm(toForm(profileRes.data.profile));
      setLogoPreview(profileRes.data.profile?.company_logo ?? null);
      setCoverPreview((profileRes.data.profile as RecruiterCompanyProfile & { cover_image?: string })?.cover_image ?? null);
      const summary = summaryRes?.data as { published?: number; open_positions?: number; paused?: number } | undefined;
      setOpenPositions(
        Number(summary?.published ?? 0) + Number(summary?.paused ?? 0),
      );
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load recruiter profile"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [key]: e.target.value }));
    };

  const save = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value ?? ""));
      fd.append("save_and_continue", "1");
      if (logoFile) fd.append("company_logo", logoFile);
      if (coverFile) fd.append("cover_image", coverFile);
      const res = await recruiterOnboardingService.saveProfile(fd);
      setOnboarding(res.data.onboarding);
      setForm(toForm(res.data.profile));
      setLogoPreview(res.data.profile?.company_logo ?? null);
      setCoverPreview((res.data.profile as RecruiterCompanyProfile & { cover_image?: string })?.cover_image ?? null);
      setLogoFile(null);
      setCoverFile(null);
      toast.success("Recruiter profile updated");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <RecruiterLayout
      title="Company Profile"
      subtitle="Manage your recruiter brand and company details"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || saving}>
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
          <Button variant="brand" size="sm" onClick={() => void save()} disabled={loading || saving}>
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      }
    >
      {loading ? (
        <RecruiterLoadingSkeleton rows={6} />
      ) : error ? (
        <RecruiterErrorState message={error} onRetry={load} />
      ) : (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="relative h-36 bg-muted sm:h-44">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">
                  Upload a cover image
                </div>
              )}
              <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background/90 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <Upload className="h-3.5 w-3.5" /> Cover
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setCoverFile(file);
                    if (file) setCoverPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-border bg-muted">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-display text-xl font-bold">
                    {form.company_name || "Your company"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {form.recruiter_name || "Recruiter"} · {form.designation || "Designation"}
                  </p>
                </div>
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
                    if (file) setLogoPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard label="Profile completion" value={`${onboarding?.profile_completion ?? 0}%`} />
            <MetricCard label="Open positions" value={String(openPositions)} />
            <MetricCard
              label="Approval status"
              value={onboarding?.approval_status ?? "—"}
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-5">
            <h3 className="font-semibold">Company details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name *">
                <Input value={form.company_name} onChange={update("company_name")} />
              </Field>
              <Field label="Recruiter name *">
                <Input value={form.recruiter_name} onChange={update("recruiter_name")} />
              </Field>
              <Field label="Designation *">
                <Input value={form.designation} onChange={update("designation")} />
              </Field>
              <Field label="Recruiter type">
                <select className="auth-input w-full" value={form.recruiter_type} onChange={update("recruiter_type")}>
                  <option value="">Select type</option>
                  {RECRUITER_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Industry *">
                <Input value={form.industry} onChange={update("industry")} />
              </Field>
              <Field label="Company size *">
                <Input value={form.company_size} onChange={update("company_size")} />
              </Field>
              <Field label="Website *">
                <Input value={form.website} onChange={update("website")} />
              </Field>
              <Field label="Company registration number *">
                <Input
                  value={form.company_registration_number}
                  onChange={update("company_registration_number")}
                />
              </Field>
              <Field label="GST number">
                <Input value={form.gst_number} onChange={update("gst_number")} />
              </Field>
            </div>
            <Field label="About company *">
              <Textarea rows={3} value={form.about_company} onChange={update("about_company")} />
            </Field>
            <Field label="Company description *">
              <Textarea rows={4} value={form.company_description} onChange={update("company_description")} />
            </Field>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-5">
            <h3 className="font-semibold">Contact & address</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email *" icon={Mail}>
                <Input type="email" value={form.email} onChange={update("email")} />
              </Field>
              <Field label="Phone *" icon={Phone}>
                <Input value={form.phone} onChange={update("phone")} />
              </Field>
              <Field label="Office address *" icon={MapPin} className="sm:col-span-2">
                <Textarea rows={2} value={form.office_address} onChange={update("office_address")} />
              </Field>
              <Field label="City *">
                <Input value={form.city} onChange={update("city")} />
              </Field>
              <Field label="State *">
                <Input value={form.state} onChange={update("state")} />
              </Field>
              <Field label="Country *">
                <Input value={form.country} onChange={update("country")} />
              </Field>
              <Field label="PIN code *">
                <Input value={form.pin_code} onChange={update("pin_code")} />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-5">
            <h3 className="font-semibold">Social links</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="LinkedIn" icon={Linkedin}>
                <Input value={form.linkedin} onChange={update("linkedin")} />
              </Field>
              <Field label="Website" icon={Globe}>
                <Input value={form.website} onChange={update("website")} />
              </Field>
              <Field label="Facebook">
                <Input value={form.facebook} onChange={update("facebook")} />
              </Field>
              <Field label="Instagram">
                <Input value={form.instagram} onChange={update("instagram")} />
              </Field>
              <Field label="Twitter">
                <Input value={form.twitter} onChange={update("twitter")} />
              </Field>
            </div>
          </section>
        </div>
      )}
    </RecruiterLayout>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
  icon: Icon,
  className,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 inline-flex items-center gap-1.5">
        {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
