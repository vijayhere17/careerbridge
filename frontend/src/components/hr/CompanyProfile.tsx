import { useEffect, useState } from "react";
import { Building2, Save } from "lucide-react";
import { HrLayout } from "@/components/hr/HrLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { hrService, type HRProfile } from "@/services/hrService";

export function HrCompanyProfilePage() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    company_name: "",
    designation: "",
    department: "",
    company_website: "",
    industry: "",
    company_size: "",
    company_description: "",
    office_location: "",
    phone: "",
    linkedin: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    hrService
      .getProfile()
      .then((res) => {
        const profile = res.data.profile;
        const user = res.data.user;
        setForm({
          name: user?.name ?? "",
          mobile: user?.mobile ?? "",
          company_name: profile?.company_name ?? "",
          designation: profile?.designation ?? "",
          department: profile?.department ?? "",
          company_website: profile?.company_website ?? "",
          industry: profile?.industry ?? "",
          company_size: profile?.company_size ?? "",
          company_description: profile?.company_description ?? "",
          office_location: profile?.office_location ?? "",
          phone: profile?.phone ?? "",
          linkedin: profile?.linkedin ?? "",
        });
        setLogoPreview(profile?.company_logo ?? null);
      })
      .catch((err) => setError(err?.message ?? "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (logoFile) fd.append("company_logo", logoFile);
      const res = await hrService.updateProfile(fd);
      setLogoPreview(res.data.profile.company_logo ?? null);
      setMessage("Company profile saved.");
    } catch (err: any) {
      setError(err?.message ?? "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrLayout
      title="Company Profile"
      subtitle="Company details, culture and branding"
      actions={
        <Button variant="brand" size="sm" form="hr-company-form" disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <form id="hr-company-form" onSubmit={submit} className="max-w-3xl space-y-6">
          {message && (
            <div className="rounded-xl border border-secondary/30 bg-secondary-soft p-3 text-sm text-secondary">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <section className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-primary-soft text-primary overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-6 w-6" />
                )}
              </div>
              <div>
                <Label>Company logo</Label>
                <Input
                  className="mt-1"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setLogoFile(file);
                    if (file) setLogoPreview(URL.createObjectURL(file));
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company name" value={form.company_name} onChange={(v) => set("company_name", v)} required />
              <Field label="Industry" value={form.industry} onChange={(v) => set("industry", v)} />
              <Field label="Company size" value={form.company_size} onChange={(v) => set("company_size", v)} placeholder="e.g. 51-200" />
              <Field label="Website" value={form.company_website} onChange={(v) => set("company_website", v)} />
              <Field label="Office location" value={form.office_location} onChange={(v) => set("office_location", v)} />
              <Field label="Company phone" value={form.phone} onChange={(v) => set("phone", v)} />
              <Field label="LinkedIn" value={form.linkedin} onChange={(v) => set("linkedin", v)} />
              <Field label="Your designation" value={form.designation} onChange={(v) => set("designation", v)} />
              <Field label="Your department" value={form.department} onChange={(v) => set("department", v)} />
              <Field label="Your name" value={form.name} onChange={(v) => set("name", v)} />
              <Field label="Your mobile" value={form.mobile} onChange={(v) => set("mobile", v)} />
            </div>

            <div className="space-y-2">
              <Label>Company description / culture</Label>
              <Textarea
                rows={5}
                value={form.company_description}
                onChange={(e) => set("company_description", e.target.value)}
                placeholder="Describe your company culture, mission and workplace…"
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
