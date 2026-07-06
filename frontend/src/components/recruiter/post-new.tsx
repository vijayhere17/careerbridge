import { useState } from "react";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  GraduationCap,
  Laptop,
  Flame,
  Check,
  Eye,
  Save,
  Send,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Wallet,
  Calendar,
  ShieldCheck,
  Globe2,
  Building2,
  Home,
} from "lucide-react";

const opportunityTypes = [
  {
    id: "job",
    label: "Job",
    desc: "Full-time role",
    icon: Briefcase,
    tint: "bg-primary-soft text-primary",
  },
  {
    id: "internship",
    label: "Internship",
    desc: "For students / freshers",
    icon: GraduationCap,
    tint: "bg-secondary-soft text-secondary",
  },
  {
    id: "freelance",
    label: "Freelance Project",
    desc: "Short/long project",
    icon: Laptop,
    tint: "bg-accent-soft text-accent-foreground",
  },
  {
    id: "urgent",
    label: "Urgent Hiring",
    desc: "Fill within days",
    icon: Flame,
    tint: "bg-destructive/10 text-destructive",
  },
] as const;

const steps = ["Opportunity Type", "Basic Information", "Details", "Preview & Publish"];

export function PostNewOpportunity() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState<string>("job");
  const [mode, setMode] = useState<"Remote" | "Hybrid" | "Office">("Hybrid");
  const [visibility, setVisibility] = useState<"public" | "locked">("locked");

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <RecruiterLayout
      title="Post New Opportunity"
      subtitle="Publish jobs, internships, freelance & urgent hiring"
      actions={
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full">
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button variant="brand" size="sm" className="w-full">
            <Send className="h-4 w-4" /> Publish
          </Button>
        </div>
      }
    >
      {/* Stepper */}
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-5 shadow-card overflow-hidden">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s} className="flex flex-col items-start gap-2">
              <div className="flex w-full items-center gap-2">
                <span
                  className={`grid h-6 w-6 sm:h-7 sm:w-7 shrink-0 place-items-center rounded-full text-[10px] sm:text-xs font-semibold ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {i < step ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : i + 1}
                </span>
                <span
                  className={`h-1 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-muted"}`}
                />
              </div>
              <span
                className={`text-xs font-medium ${i <= step ? "text-foreground" : "text-muted-foreground"} hidden sm:block truncate`}
              >
                {s}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          {step === 0 && (
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-card max-w-full">
              <h3 className="font-semibold">Choose opportunity type</h3>
              <p className="text-sm text-muted-foreground">
                Select what kind of role you're posting.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {opportunityTypes.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`text-left rounded-2xl border p-3 sm:p-4 transition-shadow hover:shadow-card ${type === t.id ? "border-primary ring-2 ring-primary/20 bg-primary-soft/30" : "border-border bg-card"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`grid h-9 w-9 sm:h-11 sm:w-11 place-items-center rounded-xl ${t.tint}`}
                        >
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </div>
                        {type === t.id && <Check className="h-5 w-5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-card">
              <h3 className="font-semibold">Basic information</h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="e.g. Senior React Engineer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" defaultValue="Exotic Infotech Pvt Ltd" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" placeholder="City, Country" />
                </div>
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select defaultValue="full-time">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Experience</Label>
                  <Select defaultValue="mid">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresher">Fresher</SelectItem>
                      <SelectItem value="junior">1-3 yrs</SelectItem>
                      <SelectItem value="mid">3-6 yrs</SelectItem>
                      <SelectItem value="senior">6-10 yrs</SelectItem>
                      <SelectItem value="lead">10+ yrs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (LPA)</Label>
                  <Input id="salary" placeholder="e.g. 18 - 26 LPA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Application Deadline</Label>
                  <Input id="deadline" type="date" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="skills">Skills (comma separated)</Label>
                  <Input id="skills" placeholder="React, TypeScript, Node.js" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-card max-w-full">
                <h3 className="font-semibold">Details</h3>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea rows={4} placeholder="Role overview..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsibilities</Label>
                    <Textarea rows={3} placeholder="• Own frontend architecture..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Requirements</Label>
                    <Textarea rows={3} placeholder="• 5+ years React..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Benefits</Label>
                    <Textarea rows={3} placeholder="• Health insurance..." />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-card max-w-full">
                <h3 className="font-semibold">Work mode</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "Remote", icon: Globe2 },
                    { id: "Hybrid", icon: Home },
                    { id: "Office", icon: Building2 },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        className={`rounded-xl border p-3 sm:p-4 text-sm font-medium transition-shadow hover:shadow-card ${mode === m.id ? "border-primary bg-primary-soft/40 text-primary" : "border-border"}`}
                      >
                        <Icon className="mx-auto mb-2 h-4 w-4 sm:h-5 sm:w-5" />
                        {m.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-card max-w-full">
                <h3 className="font-semibold">Contact visibility</h3>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setVisibility("public")}
                    className={`text-left rounded-xl border p-4 ${visibility === "public" ? "border-primary bg-primary-soft/40" : "border-border"}`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <Globe2 className="h-4 w-4" /> Public
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Anyone can see your contact & apply directly.
                    </p>
                  </button>
                  <button
                    onClick={() => setVisibility("locked")}
                    className={`text-left rounded-xl border p-4 ${visibility === "locked" ? "border-primary bg-primary-soft/40" : "border-border"}`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldCheck className="h-4 w-4" /> Locked (Paid Unlock)
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Candidates pay a small fee to unlock your contact. You earn per unlock.
                    </p>
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-card max-w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary uppercase">
                    {type}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-bold">Senior React Engineer</h3>
                  <p className="text-sm text-muted-foreground">
                    Exotic Infotech Pvt Ltd · Pune, IN · {mode}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" /> Preview
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                <Info icon={Wallet} label="Salary" value="₹18 - 26 LPA" />
                <Info icon={Calendar} label="Deadline" value="Jul 30, 2026" />
                <Info icon={MapPin} label="Location" value="Pune, IN" />
                <Info
                  icon={ShieldCheck}
                  label="Contact"
                  value={visibility === "locked" ? "Locked" : "Public"}
                />
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                We are hiring a Senior React Engineer to lead frontend architecture across our
                fintech products. You'll own design systems, performance, and mentoring junior
                engineers.
              </p>
            </div>
          )}

          {/* Nav */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={back}
              disabled={step === 0}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button variant="brand" onClick={next} className="w-full sm:w-auto">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="brand" className="w-full sm:w-auto">
                <Send className="h-4 w-4" /> Publish Opportunity
              </Button>
            )}
          </div>
        </div>

        {/* Side tips */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
            <h4 className="font-semibold">Tips for great posts</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-secondary mt-0.5" /> Use a specific role title.
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-secondary mt-0.5" /> Add salary — 3× more
                applications.
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-secondary mt-0.5" /> Keep description under 500
                words.
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-secondary mt-0.5" /> Locked contacts earn per unlock.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-primary-soft/40 p-4 sm:p-5">
            <p className="text-sm font-semibold">Estimated reach</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">240k+ candidates</p>
            <p className="text-xs text-muted-foreground">Across IT, Product & Design domains.</p>
          </div>
        </aside>
      </div>
    </RecruiterLayout>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 font-semibold text-sm">{value}</p>
    </div>
  );
}
