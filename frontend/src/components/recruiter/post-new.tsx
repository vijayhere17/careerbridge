import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Check,
  Eye,
  Flame,
  Globe2,
  GraduationCap,
  Home,
  Laptop,
  MapPin,
  Save,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  recruiterService,
  type RecruiterOpportunity,
} from "@/services/recruiterOpportunityService";

type WorkMode = "Remote" | "Hybrid" | "Office";
type ContactVisibility = "public" | "locked";

type OpportunityForm = {
  opportunity_type: string;
  title: string;
  company_name: string;
  location: string;
  employment_type: string;
  experience_level: string;
  salary_min: string;
  salary_max: string;
  application_deadline: string;
  skills: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  work_mode: WorkMode;
  contact_visibility: ContactVisibility;
  contact_price: string;
};

type FormErrors = Partial<Record<keyof OpportunityForm, string>>;

const emptyForm: OpportunityForm = {
  opportunity_type: "job",
  title: "",
  company_name: "",
  location: "",
  employment_type: "",
  experience_level: "",
  salary_min: "",
  salary_max: "",
  application_deadline: "",
  skills: "",
  description: "",
  responsibilities: "",
  requirements: "",
  benefits: "",
  work_mode: "Hybrid",
  contact_visibility: "locked",
  contact_price: "49",
};

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

const workModes = [
  { id: "Remote", icon: Globe2 },
  { id: "Hybrid", icon: Home },
  { id: "Office", icon: Building2 },
] as const;

const steps = ["Opportunity Type", "Basic Information", "Details", "Preview & Publish"];

export function PostNewOpportunity() {
  const navigate = useNavigate();
  const search = useRouterState({
    select: (state) => state.location.search as { id?: string | number },
  });
  const editId = useMemo(() => normalizeId(search.id), [search.id]);
  const isEdit = editId !== null;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OpportunityForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState("");
  const [draftId, setDraftId] = useState<number | null>(editId);

  const loadOpportunity = useCallback(async () => {
    if (!editId) return;

    setLoading(true);
    setLoadError("");
    try {
      const response = await recruiterService.getOpportunity(editId);
      setForm(toFormState(response.data));
    } catch (error) {
      const message = apiErrorMessage(error, "Failed to load opportunity");
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [editId]);

  useEffect(() => {
    void loadOpportunity();
  }, [loadOpportunity]);

  useEffect(() => {
    if (isEdit || saving || loading) return;
    if (!form.title.trim() && !form.company_name.trim()) return;

    const timer = window.setTimeout(async () => {
      try {
        const payload = toPayload(form);
        if (draftId) {
          await recruiterService.updateOpportunity(draftId, { ...payload, status: "draft" });
        } else {
          const res = await recruiterService.saveDraft(payload);
          if (res.data?.id) setDraftId(res.data.id);
        }
        setAutoSaveLabel(`Draft auto-saved at ${new Date().toLocaleTimeString()}`);
      } catch {
        /* silent autosave */
      }
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [form, draftId, isEdit, saving, loading]);

  const set = (field: keyof OpportunityForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const next = () => {
    if (step === 0 && !form.opportunity_type) {
      setErrors((current) => ({
        ...current,
        opportunity_type: "Opportunity type is required.",
      }));
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const back = () => setStep((current) => Math.max(current - 1, 0));

  const submit = async (mode: "draft" | "publish") => {
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const payload = toPayload(form);
    setSaving(mode);
    try {
      const targetId = editId ?? draftId;
      if (targetId) {
        await recruiterService.updateOpportunity(targetId, {
          ...payload,
          status: mode === "publish" ? "published" : "draft",
        });
      } else if (mode === "publish") {
        await recruiterService.publishOpportunity(payload);
      } else {
        const res = await recruiterService.saveDraft(payload);
        if (res.data?.id) setDraftId(res.data.id);
      }

      toast.success(mode === "publish" ? "Opportunity published" : "Draft saved");
      await navigate({ to: "/recruiter/manage-posts" });
    } catch (error) {
      setErrors(serverFieldErrors(error));
      toast.error(apiErrorMessage(error, "Failed to save opportunity"));
    } finally {
      setSaving(null);
    }
  };

  const previewType = opportunityTypes.find((type) => type.id === form.opportunity_type);
  const isBusy = saving !== null || loading;

  return (
    <RecruiterLayout
      title={isEdit ? "Edit Opportunity" : "Post New Opportunity"}
      subtitle={
        isEdit
          ? "Update details and republish your opportunity"
          : "Publish jobs, internships, freelance & urgent hiring"
      }
      actions={
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isBusy}
            onClick={() => void submit("draft")}
          >
            <Save className="h-4 w-4" /> {saving === "draft" ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            type="button"
            variant="brand"
            size="sm"
            className="w-full"
            disabled={isBusy}
            onClick={() => void submit("publish")}
          >
            <Send className="h-4 w-4" /> {saving === "publish" ? "Publishing..." : "Publish"}
          </Button>
        </div>
      }
    >
      {loading ? (
        <RecruiterLoadingSkeleton rows={5} />
      ) : loadError ? (
        <RecruiterErrorState message={loadError} onRetry={() => void loadOpportunity()} />
      ) : (
        <>
          {autoSaveLabel && (
            <p className="mb-3 text-xs text-muted-foreground">{autoSaveLabel}</p>
          )}
          <div className="rounded-2xl border border-border bg-card p-3 shadow-card sm:p-5">
            <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((label, index) => (
                <li key={label} className="flex flex-col items-start gap-2">
                  <div className="flex w-full items-center gap-2">
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold sm:h-7 sm:w-7 sm:text-xs ${
                        index <= step
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index < step ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : index + 1}
                    </span>
                    <span
                      className={`h-1 flex-1 rounded-full ${index < step ? "bg-primary" : "bg-muted"}`}
                    />
                  </div>
                  <span
                    className={`hidden truncate text-xs font-medium sm:block ${
                      index <= step ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
            <div className="space-y-4 lg:col-span-2 lg:space-y-6">
              {step === 0 && (
                <section className="rounded-2xl border border-border bg-card p-3 shadow-card sm:p-6">
                  <h3 className="font-semibold">Choose opportunity type</h3>
                  <p className="text-sm text-muted-foreground">
                    Select what kind of role you're posting.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {opportunityTypes.map((type) => {
                      const Icon = type.icon;
                      const selected = form.opportunity_type === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => set("opportunity_type", type.id)}
                          className={`rounded-2xl border p-3 text-left transition-shadow hover:shadow-card sm:p-4 ${
                            selected
                              ? "border-primary bg-primary-soft/30 ring-2 ring-primary/20"
                              : "border-border bg-card"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`grid h-9 w-9 place-items-center rounded-xl sm:h-11 sm:w-11 ${type.tint}`}
                            >
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </span>
                            <div className="flex-1">
                              <p className="font-semibold">{type.label}</p>
                              <p className="text-xs text-muted-foreground">{type.desc}</p>
                            </div>
                            {selected && <Check className="h-5 w-5 text-primary" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <FieldError message={errors.opportunity_type} />
                </section>
              )}

              {step === 1 && (
                <section className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
                  <h3 className="font-semibold">Basic information</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={form.title}
                        onChange={(event) => set("title", event.target.value)}
                        placeholder="e.g. Senior React Engineer"
                      />
                      <FieldError message={errors.title} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company *</Label>
                      <Input
                        id="company_name"
                        value={form.company_name}
                        onChange={(event) => set("company_name", event.target.value)}
                        placeholder="Company name"
                      />
                      <FieldError message={errors.company_name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={form.location}
                        onChange={(event) => set("location", event.target.value)}
                        placeholder="City, Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Employment Type</Label>
                      <Select
                        value={form.employment_type}
                        onValueChange={(value) => set("employment_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Experience</Label>
                      <Select
                        value={form.experience_level}
                        onValueChange={(value) => set("experience_level", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="salary_min">Salary Min</Label>
                        <Input
                          id="salary_min"
                          min="0"
                          type="number"
                          value={form.salary_min}
                          onChange={(event) => set("salary_min", event.target.value)}
                          placeholder="e.g. 18"
                        />
                        <FieldError message={errors.salary_min} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salary_max">Salary Max</Label>
                        <Input
                          id="salary_max"
                          min="0"
                          type="number"
                          value={form.salary_max}
                          onChange={(event) => set("salary_max", event.target.value)}
                          placeholder="e.g. 26"
                        />
                        <FieldError message={errors.salary_max} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="application_deadline">Application Deadline</Label>
                      <Input
                        id="application_deadline"
                        type="date"
                        value={form.application_deadline}
                        onChange={(event) => set("application_deadline", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="skills">Skills (comma separated)</Label>
                      <Input
                        id="skills"
                        value={form.skills}
                        onChange={(event) => set("skills", event.target.value)}
                        placeholder="React, TypeScript, Node.js"
                      />
                    </div>
                  </div>
                </section>
              )}

              {step === 2 && (
                <>
                  <section className="rounded-2xl border border-border bg-card p-3 shadow-card sm:p-6">
                    <h3 className="font-semibold">Details</h3>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          rows={4}
                          value={form.description}
                          onChange={(event) => set("description", event.target.value)}
                          placeholder="Role overview..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="responsibilities">Responsibilities</Label>
                        <Textarea
                          id="responsibilities"
                          rows={4}
                          value={form.responsibilities}
                          onChange={(event) => set("responsibilities", event.target.value)}
                          placeholder="What will this person own?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="requirements">Requirements</Label>
                        <Textarea
                          id="requirements"
                          rows={4}
                          value={form.requirements}
                          onChange={(event) => set("requirements", event.target.value)}
                          placeholder="Must-have experience, skills, and qualifications"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="benefits">Benefits</Label>
                        <Textarea
                          id="benefits"
                          rows={3}
                          value={form.benefits}
                          onChange={(event) => set("benefits", event.target.value)}
                          placeholder="Perks, benefits, and growth opportunities"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-card p-3 shadow-card sm:p-6">
                    <h3 className="font-semibold">Work mode</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {workModes.map((mode) => {
                        const Icon = mode.icon;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => set("work_mode", mode.id)}
                            className={`rounded-xl border p-3 text-sm font-medium transition-shadow hover:shadow-card sm:p-4 ${
                              form.work_mode === mode.id
                                ? "border-primary bg-primary-soft/40 text-primary"
                                : "border-border"
                            }`}
                          >
                            <Icon className="mx-auto mb-2 h-4 w-4 sm:h-5 sm:w-5" />
                            {mode.id}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-card p-3 shadow-card sm:p-6">
                    <h3 className="font-semibold">Contact visibility</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => set("contact_visibility", "public")}
                        className={`rounded-xl border p-4 text-left ${
                          form.contact_visibility === "public"
                            ? "border-primary bg-primary-soft/40"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold">
                          <Globe2 className="h-4 w-4" /> Public
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Anyone can see your contact and apply directly.
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => set("contact_visibility", "locked")}
                        className={`rounded-xl border p-4 text-left ${
                          form.contact_visibility === "locked"
                            ? "border-primary bg-primary-soft/40"
                            : "border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-semibold">
                          <ShieldCheck className="h-4 w-4" /> Locked (Paid Unlock)
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Candidates pay a small fee to unlock your contact. You earn per unlock.
                        </p>
                      </button>
                    </div>
                    {form.contact_visibility === "locked" && (
                      <div className="mt-4 max-w-xs space-y-2">
                        <Label htmlFor="contact_price">Unlock price (₹)</Label>
                        <Input
                          id="contact_price"
                          type="number"
                          min={1}
                          value={form.contact_price}
                          onChange={(e) => set("contact_price", e.target.value)}
                        />
                      </div>
                    )}
                  </section>
                </>
              )}

              {step === 3 && (
                <section className="rounded-2xl border border-border bg-card p-3 shadow-card sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium uppercase text-primary">
                        {previewType?.label ?? "Opportunity"}
                      </span>
                      <h3 className="mt-2 font-display text-2xl font-bold">
                        {form.title.trim() || "Opportunity Title"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {form.company_name.trim() || "Company name"} ·{" "}
                        {form.location.trim() || "Location"} · {form.work_mode}
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                      <Eye className="h-4 w-4" /> Live Preview
                    </Button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                    <Info icon={Wallet} label="Salary" value={formatSalary(form)} />
                    <Info
                      icon={Calendar}
                      label="Deadline"
                      value={formatDate(form.application_deadline)}
                    />
                    <Info
                      icon={MapPin}
                      label="Location"
                      value={form.location.trim() || "Not specified"}
                    />
                    <Info
                      icon={ShieldCheck}
                      label="Contact"
                      value={form.contact_visibility === "locked" ? "Locked" : "Public"}
                    />
                  </div>
                  <div className="mt-6 space-y-4 text-sm text-muted-foreground">
                    <PreviewBlock
                      title="Description"
                      value={form.description}
                      fallback="Add a short role overview so candidates know what to expect."
                    />
                    <PreviewBlock title="Responsibilities" value={form.responsibilities} />
                    <PreviewBlock title="Requirements" value={form.requirements} />
                    <PreviewBlock title="Benefits" value={form.benefits} />
                    {form.skills.trim() && (
                      <div className="flex flex-wrap gap-2">
                        {form.skills
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter(Boolean)
                          .map((skill) => (
                            <span key={skill} className="rounded-full bg-muted px-2 py-1 text-xs">
                              {skill}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={back}
                  disabled={step === 0 || isBusy}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button
                    type="button"
                    variant="brand"
                    onClick={next}
                    disabled={isBusy}
                    className="w-full sm:w-auto"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="brand"
                    disabled={isBusy}
                    onClick={() => void submit("publish")}
                    className="w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4" />{" "}
                    {saving === "publish" ? "Publishing..." : "Publish Opportunity"}
                  </Button>
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
                <h4 className="font-semibold">Tips for great posts</h4>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-secondary" /> Use a specific role title.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-secondary" /> Add salary - more candidates
                    apply when compensation is clear.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-secondary" /> Keep description concise and
                    outcome focused.
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-secondary" /> Locked contacts earn per
                    unlock.
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-primary-soft/40 p-4 sm:p-5">
                <p className="text-sm font-semibold">Estimated reach</p>
                <p className="mt-1 font-display text-2xl font-bold text-primary">
                  240k+ candidates
                </p>
                <p className="text-xs text-muted-foreground">
                  Across IT, Product and Design domains.
                </p>
              </div>
            </aside>
          </div>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Opportunity preview</DialogTitle>
                <DialogDescription>
                  This is how candidates will see your opportunity.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div>
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium uppercase text-primary">
                    {previewType?.label ?? "Opportunity"}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-bold">
                    {form.title.trim() || "Opportunity Title"}
                  </h3>
                  <p className="text-muted-foreground">
                    {form.company_name.trim() || "Company"} · {form.location.trim() || "Location"} ·{" "}
                    {form.work_mode}
                  </p>
                </div>
                <PreviewBlock title="Description" value={form.description} fallback="No description yet." />
                <PreviewBlock title="Responsibilities" value={form.responsibilities} />
                <PreviewBlock title="Requirements" value={form.requirements} />
                <PreviewBlock title="Skills" value={form.skills} />
                <p className="text-xs text-muted-foreground">
                  Contact visibility: {form.contact_visibility}
                  {form.contact_visibility === "locked"
                    ? ` · Unlock price ₹${form.contact_price || "0"}`
                    : ""}
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </RecruiterLayout>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function PreviewBlock({
  title,
  value,
  fallback,
}: {
  title: string;
  value: string;
  fallback?: string;
}) {
  const text = value.trim();
  if (!text && !fallback) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</p>
      <p className="mt-1 whitespace-pre-line">{text || fallback}</p>
    </div>
  );
}

function validate(form: OpportunityForm): FormErrors {
  const nextErrors: FormErrors = {};
  const min = numberOrNull(form.salary_min);
  const max = numberOrNull(form.salary_max);

  if (!form.opportunity_type.trim()) {
    nextErrors.opportunity_type = "Opportunity type is required.";
  }
  if (!form.title.trim()) {
    nextErrors.title = "Title is required.";
  }
  if (!form.company_name.trim()) {
    nextErrors.company_name = "Company name is required.";
  }
  if (form.salary_min.trim() && min === null) {
    nextErrors.salary_min = "Enter a valid salary minimum.";
  }
  if (form.salary_max.trim() && max === null) {
    nextErrors.salary_max = "Enter a valid salary maximum.";
  }
  if (min !== null && max !== null && min > max) {
    nextErrors.salary_max = "Maximum salary must be greater than minimum salary.";
  }

  return nextErrors;
}

function toPayload(form: OpportunityForm): Partial<RecruiterOpportunity> {
  return {
    opportunity_type: form.opportunity_type.trim(),
    title: form.title.trim(),
    company_name: form.company_name.trim(),
    location: nullableText(form.location),
    employment_type: nullableText(form.employment_type),
    experience_level: nullableText(form.experience_level),
    salary_min: numberOrNull(form.salary_min),
    salary_max: numberOrNull(form.salary_max),
    application_deadline: nullableText(form.application_deadline),
    skills: nullableText(form.skills),
    description: nullableText(form.description),
    responsibilities: nullableText(form.responsibilities),
    requirements: nullableText(form.requirements),
    benefits: nullableText(form.benefits),
    work_mode: form.work_mode,
    contact_visibility: form.contact_visibility,
    contact_price:
      form.contact_visibility === "locked" ? numberOrNull(form.contact_price) : null,
  };
}

function toFormState(opportunity: RecruiterOpportunity): OpportunityForm {
  return {
    opportunity_type: opportunity.opportunity_type ?? "job",
    title: opportunity.title ?? "",
    company_name: opportunity.company_name ?? "",
    location: opportunity.location ?? "",
    employment_type: opportunity.employment_type ?? "",
    experience_level: opportunity.experience_level ?? "",
    salary_min: opportunity.salary_min != null ? String(opportunity.salary_min) : "",
    salary_max: opportunity.salary_max != null ? String(opportunity.salary_max) : "",
    application_deadline: dateInputValue(opportunity.application_deadline),
    skills: opportunity.skills ?? "",
    description: opportunity.description ?? "",
    responsibilities: opportunity.responsibilities ?? "",
    requirements: opportunity.requirements ?? "",
    benefits: opportunity.benefits ?? "",
    work_mode: normalizeWorkMode(opportunity.work_mode),
    contact_visibility: opportunity.contact_visibility === "public" ? "public" : "locked",
    contact_price:
      opportunity.contact_price != null ? String(opportunity.contact_price) : "49",
  };
}

function nullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function numberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeWorkMode(value: RecruiterOpportunity["work_mode"]): WorkMode {
  return value === "Remote" || value === "Office" || value === "Hybrid" ? value : "Hybrid";
}

function normalizeId(value: string | number | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function dateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function formatSalary(form: OpportunityForm) {
  const min = numberOrNull(form.salary_min);
  const max = numberOrNull(form.salary_max);
  if (min !== null && max !== null) return `₹${min} - ${max}`;
  if (min !== null) return `From ₹${min}`;
  if (max !== null) return `Up to ₹${max}`;
  return "Not disclosed";
}

function formatDate(value: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function serverFieldErrors(error: unknown): FormErrors {
  if (!error || typeof error !== "object") return {};
  const errors = (error as { errors?: Record<string, string[]> }).errors;
  if (!errors) return {};

  return Object.entries(errors).reduce<FormErrors>((nextErrors, [field, messages]) => {
    if (field in emptyForm && messages?.[0]) {
      nextErrors[field as keyof OpportunityForm] = messages[0];
    }
    return nextErrors;
  }, {});
}
