import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/auth";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  RefreshCcw,
  Save,
  Upload,
} from "lucide-react";

type RecruiterProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  currentRole: string;
  company: string;
  experience: string;
  education: string;
  skills: string[];
  linkedin: string;
  github: string;
  portfolio: string;
  lookingFor: string[];
  profilePhoto: string | null;
};

type FormState = {
  name: string;
  company: string;
  designation: string;
  industry: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  linkedin: string;
  description: string;
  hiringFor: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  company: "",
  designation: "",
  industry: "",
  location: "",
  email: "",
  phone: "",
  website: "",
  linkedin: "",
  description: "",
  hiringFor: "",
};

function toForm(profile: RecruiterProfile): FormState {
  return {
    name: profile.firstName ?? "",
    company: profile.company ?? "",
    designation: profile.currentRole ?? "",
    industry: profile.experience ?? "",
    location: profile.location ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    website: profile.portfolio ?? "",
    linkedin: profile.linkedin ?? "",
    description: profile.bio ?? "",
    hiringFor: (profile.skills ?? []).join(", "),
  };
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function logoText(company: string, name: string) {
  return (company || name || "R").trim().charAt(0).toUpperCase();
}

function Field({
  label,
  id,
  value,
  type = "text",
  icon: Icon,
  readOnly,
  onChange,
}: {
  label: string;
  id: keyof FormState;
  value: string;
  type?: string;
  icon?: React.ComponentType<{ className?: string }>;
  readOnly?: boolean;
  onChange: (field: keyof FormState, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id={id}
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange(id, event.target.value)}
          className={Icon ? "pl-9" : ""}
        />
      </div>
    </div>
  );
}

export function RecruiterProfilePage() {
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hiringCategories = useMemo(() => parseList(form.hiringFor), [form.hiringFor]);
  const previewPhoto = photoPreview ?? profile?.profilePhoto;

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiFetch<{ profile: RecruiterProfile }>("/api/profile");
      setProfile(response.profile);
      setForm(toForm(response.profile));
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Could not load recruiter profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  const update = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const body = new FormData();
      body.append("firstName", form.name);
      body.append("lastName", profile?.lastName ?? "");
      body.append("phone", form.phone);
      body.append("location", form.location);
      body.append("bio", form.description);
      body.append("currentRole", form.designation);
      body.append("company", form.company);
      body.append("experience", form.industry);
      body.append("education", profile?.education ?? "");
      body.append("linkedin", form.linkedin);
      body.append("github", profile?.github ?? "");
      body.append("portfolio", form.website);
      body.append("skills", JSON.stringify(hiringCategories));
      body.append("lookingFor", JSON.stringify(["jobs", "internships", "freelance"]));

      if (photo) {
        body.append("profilePhoto", photo);
      }

      const response = await apiFetch<{ profile: RecruiterProfile; message?: string }>(
        "/api/profile/update",
        {
          method: "POST",
          body,
        }
      );

      setProfile(response.profile);
      setForm(toForm(response.profile));
      setPhoto(null);
      setSuccess(response.message ?? "Recruiter profile updated successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Could not save recruiter profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RecruiterLayout
      title="Profile"
      subtitle="Public recruiter profile visible to candidates"
      actions={
        <Button variant="brand" size="sm" onClick={saveProfile} disabled={saving || loading}>
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
        </Button>
      }
    >
      {(error || success) && (
        <div
          className={`mb-5 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <span className="flex items-center gap-2">
            {error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {error || success}
          </span>
          {error && (
            <button
              onClick={loadProfile}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Retry
            </button>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-primary-soft text-2xl font-bold text-primary ring-2 ring-primary/20">
                {previewPhoto ? (
                  <img src={previewPhoto} alt={form.name} className="h-full w-full object-cover" />
                ) : (
                  logoText(form.company, form.name)
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="sr-only"
                  onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary-soft text-3xl font-bold text-primary">
              {logoText(form.company, form.name)}
            </div>
          </div>

          <div className="flex-1">
            {loading ? (
              <div className="space-y-3">
                <div className="h-7 w-52 animate-pulse rounded bg-muted" />
                <div className="h-4 w-72 animate-pulse rounded bg-muted" />
                <div className="h-4 w-60 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-bold">{form.name || "Recruiter name"}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft px-2 py-0.5 text-xs font-medium text-secondary">
                    <CheckCircle2 className="h-3 w-3" /> Opportunity Provider
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {form.designation || "Designation"} · {form.company || "Company"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.industry || "Industry"} · {form.location || "Location"}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Open positions</p>
                    <p className="font-semibold">Connected soon</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Categories</p>
                    <p className="font-semibold">{hiringCategories.length}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-semibold text-secondary">Active</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Profile</p>
                    <p className="font-semibold">{form.company && form.name ? "Ready" : "Incomplete"}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-2">
          <h3 className="font-semibold">Company details</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company Name" id="company" value={form.company} icon={Building2} onChange={update} />
            <Field label="Recruiter Name" id="name" value={form.name} onChange={update} />
            <Field label="Designation" id="designation" value={form.designation} onChange={update} />
            <Field label="Industry" id="industry" value={form.industry} onChange={update} />
            <Field label="Location" id="location" value={form.location} icon={MapPin} onChange={update} />
            <Field label="Email" id="email" type="email" value={form.email} icon={Mail} readOnly onChange={update} />
            <Field label="Phone" id="phone" value={form.phone} icon={Phone} onChange={update} />
            <Field label="Website" id="website" value={form.website} icon={Globe} onChange={update} />
            <div className="sm:col-span-2">
              <Field label="LinkedIn" id="linkedin" value={form.linkedin} icon={Linkedin} onChange={update} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Company Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Tell candidates about your company, hiring process, culture and roles."
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-semibold">Hiring Categories</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Separate categories with commas.
            </p>
            <Textarea
              className="mt-3"
              rows={4}
              value={form.hiringFor}
              onChange={(event) => update("hiringFor", event.target.value)}
              placeholder="Full-Stack Engineers, SDET, Product Designers"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {hiringCategories.length === 0 ? (
                <span className="text-xs text-muted-foreground">No categories added yet.</span>
              ) : (
                hiringCategories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
                  >
                    {category}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-semibold">Current Open Positions</h3>
            <p className="mt-3 font-display text-3xl font-bold text-primary">—</p>
            <p className="text-xs text-muted-foreground">
              This can be wired to recruiter posts once post APIs are connected.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-secondary-soft/40 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-secondary" />
              <div>
                <p className="text-sm font-semibold">Profile visible to candidates</p>
                <p className="text-xs text-muted-foreground">
                  Keep your recruiter and company details updated for better applications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <Button variant="brand" onClick={saveProfile} disabled={saving || loading}>
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </RecruiterLayout>
  );
}
