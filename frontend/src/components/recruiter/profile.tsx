import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recruiterProfile } from "@/data/recruiter";
import {
  CheckCircle2,
  Upload,
  Building2,
  Save,
  Globe,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

function Field({
  label,
  id,
  defaultValue,
  type = "text",
  icon: Icon,
}: {
  label: string;
  id: string;
  defaultValue?: string;
  type?: string;
  icon?: any;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input id={id} type={type} defaultValue={defaultValue} className={Icon ? "pl-9" : ""} />
      </div>
    </div>
  );
}

export function RecruiterProfilePage() {
  return (
    <RecruiterLayout
      title="Profile"
      subtitle="Public recruiter profile visible to candidates"
      actions={
        <Button variant="brand" size="sm">
          <Save className="h-4 w-4" /> Save changes
        </Button>
      }
    >
      {/* Header card */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={recruiterProfile.avatar}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-primary/20"
              />
              <button className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
                <Upload className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary-soft text-primary text-3xl font-bold">
                {recruiterProfile.logo}
              </div>
              <button className="absolute -bottom-2 -right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface border border-border shadow-card">
                <Building2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold">{recruiterProfile.name}</h2>
              {recruiterProfile.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft px-2 py-0.5 text-xs font-medium text-secondary">
                  <CheckCircle2 className="h-3 w-3" /> Verified Recruiter
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {recruiterProfile.designation} · {recruiterProfile.company}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {recruiterProfile.industry} · {recruiterProfile.location}
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Open positions</p>
                <p className="font-semibold">{recruiterProfile.openPositions}</p>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Categories</p>
                <p className="font-semibold">{recruiterProfile.hiringFor.length}</p>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2 col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold text-secondary">Active</p>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2 col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground">Response rate</p>
                <p className="font-semibold">94%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details grid */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:col-span-2">
          <h3 className="font-semibold">Company details</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Company Name"
              id="cname"
              defaultValue={recruiterProfile.company}
              icon={Building2}
            />
            <Field label="Recruiter Name" id="rname" defaultValue={recruiterProfile.name} />
            <Field label="Designation" id="desig" defaultValue={recruiterProfile.designation} />
            <Field label="Industry" id="industry" defaultValue={recruiterProfile.industry} />
            <Field
              label="Location"
              id="loc"
              defaultValue={recruiterProfile.location}
              icon={MapPin}
            />
            <Field
              label="Email"
              id="email"
              type="email"
              defaultValue={recruiterProfile.email}
              icon={Mail}
            />
            <Field label="Phone" id="phone" defaultValue={recruiterProfile.phone} icon={Phone} />
            <Field
              label="Website"
              id="website"
              defaultValue={recruiterProfile.website}
              icon={Globe}
            />
            <div className="sm:col-span-2">
              <Field
                label="LinkedIn"
                id="linkedin"
                defaultValue={recruiterProfile.linkedin}
                icon={Linkedin}
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="desc">Company Description</Label>
              <Textarea id="desc" rows={4} defaultValue={recruiterProfile.description} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-semibold">Hiring Categories</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {recruiterProfile.hiringFor.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
                >
                  {c}
                </span>
              ))}
              <button className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
                + Add
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="font-semibold">Current Open Positions</h3>
            <p className="mt-3 font-display text-3xl font-bold text-primary">
              {recruiterProfile.openPositions}
            </p>
            <p className="text-xs text-muted-foreground">Active listings across all categories</p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary-soft/40 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-secondary shrink-0" />
              <div>
                <p className="text-sm font-semibold">Verified Company</p>
                <p className="text-xs text-muted-foreground">
                  Your GST, PAN and company docs are approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <Button variant="brand">
          <Save className="h-4 w-4" /> Save changes
        </Button>
      </div>
    </RecruiterLayout>
  );
}
