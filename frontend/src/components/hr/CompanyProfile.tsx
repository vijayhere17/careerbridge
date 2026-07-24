import { useEffect, useState, type FormEvent } from "react";
import { Building2, ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";
import { HrLayout } from "@/components/hr/HrLayout";
import { HrErrorState, HrLoadingSkeleton, apiErrorMessage } from "@/components/hr/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hrService, type HRProfile } from "@/services/hrService";

type ProfileWithUrls = HRProfile & {
  logo_url?: string | null;
  cover_url?: string | null;
};

type CompanyForm = {
  company_name: string;
  industry: string;
  company_size: string;
  company_website: string;
  office_location: string;
  locations: string;
  culture: string;
  benefits: string;
  company_description: string;
  phone: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  youtube: string;
  glassdoor: string;
};

const defaultForm: CompanyForm = {
  company_name: "",
  industry: "",
  company_size: "",
  company_website: "",
  office_location: "",
  locations: "",
  culture: "",
  benefits: "",
  company_description: "",
  phone: "",
  linkedin: "",
  twitter: "",
  facebook: "",
  instagram: "",
  youtube: "",
  glassdoor: "",
};

export function HrCompanyProfilePage() {
  const [form, setForm] = useState<CompanyForm>(defaultForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.getProfile();
      const profile = res.data.profile as ProfileWithUrls | null;
      const socialLinks = normalSocialLinks(profile?.social_links);

      setForm({
        company_name: profile?.company_name ?? "",
        industry: profile?.industry ?? "",
        company_size: profile?.company_size ?? "",
        company_website: profile?.company_website ?? "",
        office_location: profile?.office_location ?? "",
        locations: (profile?.locations ?? []).join("\n"),
        culture: profile?.culture ?? "",
        benefits: profile?.benefits ?? "",
        company_description: profile?.company_description ?? "",
        phone: profile?.phone ?? "",
        linkedin: profile?.linkedin ?? "",
        twitter: socialLinks.twitter ?? "",
        facebook: socialLinks.facebook ?? "",
        instagram: socialLinks.instagram ?? "",
        youtube: socialLinks.youtube ?? "",
        glassdoor: socialLinks.glassdoor ?? "",
      });
      setLogoPreview(profile?.logo_url ?? profile?.company_logo ?? null);
      setCoverPreview(profile?.cover_url ?? profile?.company_cover ?? null);
    } catch (err) {
      const message = apiErrorMessage(err, "Failed to load company profile");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key: keyof CompanyForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("company_name", form.company_name.trim());
      fd.append("industry", form.industry.trim());
      fd.append("company_size", form.company_size.trim());
      fd.append("company_website", form.company_website.trim());
      fd.append("office_location", form.office_location.trim());
      fd.append("culture", form.culture.trim());
      fd.append("benefits", form.benefits.trim());
      fd.append("company_description", form.company_description.trim());
      fd.append("phone", form.phone.trim());
      fd.append("linkedin", form.linkedin.trim());
      fd.append("locations", JSON.stringify(splitLocations(form.locations)));
      fd.append(
        "social_links",
        JSON.stringify({
          twitter: form.twitter.trim(),
          facebook: form.facebook.trim(),
          instagram: form.instagram.trim(),
          youtube: form.youtube.trim(),
          glassdoor: form.glassdoor.trim(),
        }),
      );
      if (logoFile) fd.append("company_logo", logoFile);
      if (coverFile) fd.append("company_cover", coverFile);

      const res = await hrService.updateProfile(fd);
      const profile = res.data.profile as ProfileWithUrls;
      setLogoPreview(profile.logo_url ?? profile.company_logo ?? logoPreview);
      setCoverPreview(profile.cover_url ?? profile.company_cover ?? coverPreview);
      setLogoFile(null);
      setCoverFile(null);
      toast.success("Company profile saved");
    } catch (err) {
      const message = apiErrorMessage(err, "Could not save company profile");
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrLayout
      title="Company Profile"
      subtitle="Company details, culture and branding"
      actions={
        <Button variant="brand" size="sm" form="hr-company-form" disabled={saving || loading}>
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
        </Button>
      }
    >
      {loading ? (
        <HrLoadingSkeleton rows={5} />
      ) : (
        <form id="hr-company-form" onSubmit={submit} className="space-y-6">
          {error && <HrErrorState message={error} onRetry={load} />}

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="relative h-48 bg-muted">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Company cover preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <div className="text-center">
                    <ImagePlus className="mx-auto h-10 w-10" />
                    <p className="mt-2 text-sm">Upload a company cover</p>
                  </div>
                </div>
              )}
              <div className="absolute -bottom-10 left-5 grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border-4 border-card bg-primary-soft text-primary shadow-card">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-9 w-9" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 pt-14 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Company logo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setLogoFile(file);
                    if (file) setLogoPreview(URL.createObjectURL(file));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Company cover</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setCoverFile(file);
                    if (file) setCoverPreview(URL.createObjectURL(file));
                  }}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-semibold">Company details</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Company name"
                value={form.company_name}
                onChange={(v) => set("company_name", v)}
                required
              />
              <Field label="Industry" value={form.industry} onChange={(v) => set("industry", v)} />
              <Field
                label="Size"
                value={form.company_size}
                onChange={(v) => set("company_size", v)}
                placeholder="e.g. 51-200"
              />
              <Field
                label="Website"
                value={form.company_website}
                onChange={(v) => set("company_website", v)}
                placeholder="https://example.com"
              />
              <Field
                label="Office location"
                value={form.office_location}
                onChange={(v) => set("office_location", v)}
              />
              <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
              <Field
                label="LinkedIn"
                value={form.linkedin}
                onChange={(v) => set("linkedin", v)}
                placeholder="https://linkedin.com/company/..."
              />
              <div className="space-y-2 sm:col-span-2">
                <Label>Locations</Label>
                <Textarea
                  rows={3}
                  value={form.locations}
                  onChange={(e) => set("locations", e.target.value)}
                  placeholder="New York, Remote, London or one per line"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-semibold">Culture and benefits</h3>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <TextareaField
                label="Description"
                value={form.company_description}
                onChange={(v) => set("company_description", v)}
                placeholder="Describe your mission, team, products, and workplace."
              />
              <TextareaField
                label="Culture"
                value={form.culture}
                onChange={(v) => set("culture", v)}
                placeholder="What values and working style should candidates expect?"
              />
              <TextareaField
                label="Benefits"
                value={form.benefits}
                onChange={(v) => set("benefits", v)}
                placeholder="Health benefits, flexibility, learning budgets, equity, and perks."
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-semibold">Social links</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Twitter" value={form.twitter} onChange={(v) => set("twitter", v)} />
              <Field label="Facebook" value={form.facebook} onChange={(v) => set("facebook", v)} />
              <Field
                label="Instagram"
                value={form.instagram}
                onChange={(v) => set("instagram", v)}
              />
              <Field label="YouTube" value={form.youtube} onChange={(v) => set("youtube", v)} />
              <Field
                label="Glassdoor"
                value={form.glassdoor}
                onChange={(v) => set("glassdoor", v)}
              />
            </div>
          </section>
        </form>
      )}
    </HrLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function splitLocations(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalSocialLinks(value: HRProfile["social_links"]) {
  if (!value || Array.isArray(value)) return {};
  return value;
}
