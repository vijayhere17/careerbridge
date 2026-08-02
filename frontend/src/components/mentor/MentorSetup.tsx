import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  User, Mail, Phone, MapPin, Building2, Briefcase, GraduationCap,
  FileText, Plus, X, Camera, Linkedin, Github, Globe, Video,
  ShieldCheck, ArrowRight, ArrowLeft, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/common/BrandLogo";
import { apiFetch, getAuthToken, type AuthUser } from "@/lib/auth";


/* ────────────────────────────────────────────────────────────
   Static config
   ──────────────────────────────────────────────────────────── */

const STEPS = [
  { key: "personal", label: "Personal" },
  { key: "professional", label: "Professional" },
  { key: "expertise", label: "Expertise" },
  { key: "profile", label: "Profile" },
] as const;

const INDUSTRIES = [
  "Information Technology", "Software Development", "Product Management",
  "Finance", "Banking", "Marketing", "Sales", "Human Resources",
  "Chemical", "Pharmaceutical", "Healthcare", "Mechanical", "Civil",
  "Electrical", "Education", "Other",
];

const EXPERIENCE_RANGES = ["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"];

const SERVICE_OPTIONS = [
  { key: "career_guidance", label: "Career Guidance" },
  { key: "resume_review", label: "Resume Review" },
  { key: "mock_interview", label: "Mock Interview" },
  { key: "portfolio_review", label: "Portfolio Review" },
  { key: "technical_mentorship", label: "Technical Mentorship" },
  { key: "quick_chat", label: "Quick Career Chat" },
];

const BIO_MAX = 500;

type FormState = {
  name: string;
  email: string;
  mobile: string;
  location: string;
  company: string;
  designation: string;
  industry: string;
  experience: string;
  education: string;
  bio: string;
  skills: string[];
  languages: string[];
  services: string[];
  linkedin: string;
  portfolio: string;
  github: string;
  introVideo: string;
};

const emptyForm: FormState = {
  name: "", email: "", mobile: "", location: "",
  company: "", designation: "", industry: "", experience: "", education: "", bio: "",
  skills: [], languages: [], services: [],
  linkedin: "", portfolio: "", github: "", introVideo: "",
};

/* ────────────────────────────────────────────────────────────
   Small building blocks
   ──────────────────────────────────────────────────────────── */

function BrandHeader() {
  return <BrandLogo size="sm" asLink={false} />;
}

function StepProgress({ current }: { current: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
          Step {current + 1} of {STEPS.length}
        </p>
        <p className="text-[11px] font-medium text-muted-foreground">{STEPS[current].label}</p>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < current ? "bg-primary" : i === current ? "gradient-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function Field({
  label, icon: Icon, required, hint, children,
}: {
  label: string;
  icon?: React.ElementType;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-ring transition-all">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
        {children}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TagInput({
  values, onAdd, onRemove, inputValue, onInputChange, placeholder,
}: {
  values: string[];
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  placeholder: string;
}) {
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      const exists = values.some((v) => v.toLowerCase() === trimmed.toLowerCase());
      if (!exists) onAdd(trimmed);
      onInputChange("");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-ring transition-all">
        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {values.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-3 pr-1.5 text-xs font-medium text-primary"
            >
              {v}
              <button
                type="button"
                onClick={() => onRemove(v)}
                className="grid h-4 w-4 place-items-center rounded-full hover:bg-primary/20 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export function MentorSetupPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [skillInput, setSkillInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Prefill from the authenticated user
  useEffect(() => {
    async function load() {
      const token = getAuthToken();
      if (!token) { router.navigate({ to: "/login" }); return; }
      try {
        const r = await apiFetch<{ user: AuthUser }>("/api/auth/user");
        setForm((f) => ({
          ...f,
          name: r.user.name ?? "",
          email: r.user.email ?? "",
          mobile: r.user.mobile ?? "",
        }));
      } catch {
        // Non-fatal — user can still fill the form manually.
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  // Clean up the object URL used for the photo preview
  useEffect(() => {
    return () => {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
    };
  }, [profilePreview]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      setError("Profile photo must be a JPG or PNG image.");
      return;
    }
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePhoto(file);
    setProfilePreview(URL.createObjectURL(file));
    setError("");
  };

  const toggleService = (key: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(key)
        ? f.services.filter((s) => s !== key)
        : [...f.services, key],
    }));
  };

  const goNext = () => {
    setError("");
    if (currentStep === 0) {
      if (!form.name.trim() || !form.mobile.trim()) {
        setError("Please fill in your name and mobile number.");
        return;
      }
    }
    if (currentStep === 1) {
      if (!form.company.trim() || !form.designation.trim() || !form.industry) {
        setError("Company, designation and industry are required.");
        return;
      }
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError("");
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const validateAll = (): { message: string; step: number } | null => {
    if (!form.company.trim() || !form.designation.trim() || !form.industry) {
      return { message: "Company, designation and industry are required.", step: 1 };
    }
    if (!form.bio.trim()) {
      return { message: "Please add a short professional bio.", step: 1 };
    }
    if (form.skills.length === 0) {
      return { message: "Please add at least one skill.", step: 2 };
    }
    return null;
  };

  const submit = async () => {
    const invalid = validateAll();
    if (invalid) {
      setError(invalid.message);
      setCurrentStep(invalid.step);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("mobile", form.mobile);
      formData.append("location", form.location);
      formData.append("company", form.company);
      formData.append("designation", form.designation);
      formData.append("industry", form.industry);
      formData.append("experience", form.experience);
      formData.append("education", form.education);
      formData.append("bio", form.bio);
      formData.append("skills", JSON.stringify(form.skills));
      formData.append("languages", JSON.stringify(form.languages));
      formData.append("services", JSON.stringify(form.services));
      formData.append("linkedin", form.linkedin);
      formData.append("portfolio", form.portfolio);
      formData.append("github", form.github);
      formData.append("introVideo", form.introVideo);
      if (profilePhoto) formData.append("profilePhoto", profilePhoto);

      await apiFetch("/api/mentor/profile/setup", {
        method: "POST",
        body: formData,
      });
      router.navigate({ to: "/mentor-review" });
    } catch (err: any) {
      setError(err?.message ?? "Could not submit your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="container-page flex h-16 items-center">
          <BrandHeader />
        </div>
      </header>

      <main className="container-page max-w-2xl py-6 sm:py-10 pb-28 lg:pb-10">
        <div className="mb-6">
          <h1 className="font-display text-xl sm:text-2xl font-bold">Complete Your Mentor Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Help candidates understand your expertise and book the right session with you.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
          <StepProgress current={currentStep} />

          {/* STEP 1 — PERSONAL */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Field label="Full Name" icon={User} required>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Vijay Kumar"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <Field label="Email Address" icon={Mail}>
                <input
                  value={form.email}
                  readOnly
                  className="w-full bg-transparent text-sm text-muted-foreground outline-none"
                />
              </Field>

              <Field label="Mobile Number" icon={Phone} required>
                <input
                  value={form.mobile}
                  onChange={(e) => set("mobile", e.target.value)}
                  placeholder="9876543210"
                  inputMode="numeric"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <Field label="Location" icon={MapPin}>
                <input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Ahmedabad, Gujarat"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>
            </div>
          )}

          {/* STEP 2 — PROFESSIONAL */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Field label="Current Company" icon={Building2} required>
                <input
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                  placeholder="e.g. Infosys"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <Field label="Current Designation" icon={Briefcase} required>
                <input
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <Field label="Industry" icon={Sparkles} required>
                <select
                  value={form.industry}
                  onChange={(e) => set("industry", e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                >
                  <option value="">Select an industry</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </Field>

              <Field label="Years of Experience" icon={Briefcase}>
                <select
                  value={form.experience}
                  onChange={(e) => set("experience", e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                >
                  <option value="">Select experience</option>
                  {EXPERIENCE_RANGES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>

              <Field label="Education" icon={GraduationCap}>
                <input
                  value={form.education}
                  onChange={(e) => set("education", e.target.value)}
                  placeholder="e.g. B.Tech, Computer Science"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-foreground">
                  Professional Bio <span className="text-destructive">*</span>
                </label>
                <div className="rounded-xl border border-border bg-background px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-ring transition-all">
                  <textarea
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value.slice(0, BIO_MAX))}
                    rows={4}
                    placeholder="Tell candidates about your experience and how you can help them..."
                    className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <p className="mt-1 text-right text-[11px] text-muted-foreground">
                  {form.bio.length}/{BIO_MAX}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 — EXPERTISE */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Skills</label>
                <TagInput
                  values={form.skills}
                  onAdd={(v) => set("skills", [...form.skills, v])}
                  onRemove={(v) => set("skills", form.skills.filter((s) => s !== v))}
                  inputValue={skillInput}
                  onInputChange={setSkillInput}
                  placeholder="Add a skill and press Enter"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Languages</label>
                <TagInput
                  values={form.languages}
                  onAdd={(v) => set("languages", [...form.languages, v])}
                  onRemove={(v) => set("languages", form.languages.filter((l) => l !== v))}
                  inputValue={languageInput}
                  onInputChange={setLanguageInput}
                  placeholder="Add a language and press Enter"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">Mentor Services</label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_OPTIONS.map(({ key, label }) => {
                    const selected = form.services.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleService(key)}
                        className={`rounded-xl border-2 px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                          selected
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — PROFILE & LINKS */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group relative grid h-24 w-24 place-items-center rounded-full border-2 border-dashed border-border bg-muted overflow-hidden"
                >
                  {profilePreview ? (
                    <img src={profilePreview} alt="Profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-7 w-7 text-muted-foreground" />
                  )}
                  <span className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
                    <Camera className="h-5 w-5 text-white" />
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <p className="mt-2 text-[11px] text-muted-foreground">Upload a profile photo</p>
              </div>

              <Field label="LinkedIn URL" icon={Linkedin}>
                <input
                  value={form.linkedin}
                  onChange={(e) => set("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <Field label="Portfolio URL" icon={Globe}>
                <input
                  value={form.portfolio}
                  onChange={(e) => set("portfolio", e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <Field label="GitHub URL" icon={Github}>
                <input
                  value={form.github}
                  onChange={(e) => set("github", e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <Field label="Intro Video URL (Optional)" icon={Video} hint="Add a short introduction video to help candidates know you better.">
                <input
                  value={form.introVideo}
                  onChange={(e) => set("introVideo", e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your mentor profile will be reviewed by the CareerBridge team before it becomes publicly visible.
                </p>
              </div>
            </div>
          )}

          {error && <div className="mt-4"><ErrorCard message={error} /></div>}

          {/* Desktop / inline actions */}
          <div className="mt-6 hidden gap-2 lg:flex">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goBack}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button variant="brand" size="lg" className="flex-1" onClick={goNext}>
                <span className="flex items-center justify-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span>
              </Button>
            ) : (
              <Button variant="brand" size="lg" className="flex-1" disabled={saving} onClick={submit}>
                {saving ? "Submitting…" : "Submit for Review"}
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Mobile sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-sm px-4 py-3 lg:hidden">
        <div className="mx-auto flex max-w-2xl gap-2">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <Button variant="brand" size="lg" className="flex-1" onClick={goNext}>
              <span className="flex items-center justify-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span>
            </Button>
          ) : (
            <Button variant="brand" size="lg" className="flex-1" disabled={saving} onClick={submit}>
              {saving ? "Submitting…" : "Submit for Review"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}