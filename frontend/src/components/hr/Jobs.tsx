import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Lock,
  Briefcase,
} from "lucide-react";
import { HrLayout } from "@/components/hr/HrLayout";
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
import { hrService, type HRJob } from "@/services/hrService";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  open: "bg-secondary-soft text-secondary",
  draft: "bg-muted text-muted-foreground",
  closed: "bg-destructive/10 text-destructive",
  on_hold: "bg-accent-soft text-accent-foreground",
};

export function HrJobsPage() {
  const [jobs, setJobs] = useState<HRJob[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.listJobs({
        page,
        search,
        status: status === "all" ? undefined : status,
        per_page: 12,
      });
      setJobs(res.data.data);
      setLastPage(res.data.last_page);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, status]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const closeJob = async (id: number) => {
    await hrService.closeJob(id);
    load();
  };

  const deleteJob = async (id: number) => {
    if (!confirm("Delete this job?")) return;
    await hrService.deleteJob(id);
    load();
  };

  return (
    <HrLayout
      title="Jobs"
      subtitle="Create and manage HR job openings"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/hr/jobs/create">
            <Plus className="h-4 w-4" /> Create Job
          </Link>
        </Button>
      }
    >
      <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search title, department, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="on_hold">On hold</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No jobs found</p>
          <p className="text-sm text-muted-foreground">Create your first opening to start hiring.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 hidden lg:block overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Openings</th>
                  <th className="px-4 py-3 font-medium">Apps</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{job.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{job.department ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{job.location ?? "—"}</td>
                    <td className="px-4 py-3">{job.openings}</td>
                    <td className="px-4 py-3">{job.applications_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[job.status])}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild variant="ghost" size="icon">
                          <Link to={`/hr/jobs/${job.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                        </Button>
                        {job.status !== "closed" && (
                          <Button variant="ghost" size="icon" onClick={() => closeJob(job.id)}>
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteJob(job.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {jobs.map((job) => (
              <div key={job.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.department ?? "General"} · {job.location ?? "Remote"}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[job.status])}>
                    {job.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {job.applications_count ?? 0} applications · {job.openings} openings
                </p>
                <div className="mt-3 flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/hr/jobs/${job.id}/edit`}>Edit</Link>
                  </Button>
                  {job.status !== "closed" && (
                    <Button variant="outline" size="sm" onClick={() => closeJob(job.id)}>Close</Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {page} of {lastPage}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </HrLayout>
  );
}

type JobFormState = {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  experience: string;
  salary_min: string;
  salary_max: string;
  openings: string;
  status: string;
  description: string;
  requirements: string;
  responsibilities: string;
};

const emptyForm: JobFormState = {
  title: "",
  department: "",
  location: "",
  employment_type: "Full-time",
  experience: "",
  salary_min: "",
  salary_max: "",
  openings: "1",
  status: "draft",
  description: "",
  requirements: "",
  responsibilities: "",
};

export function HrJobFormPage({ jobId }: { jobId?: number }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!jobId);
  const isEdit = !!jobId;

  useEffect(() => {
    if (!jobId) return;
    hrService
      .getJob(jobId)
      .then((res) => {
        const j = res.data;
        setForm({
          title: j.title ?? "",
          department: j.department ?? "",
          location: j.location ?? "",
          employment_type: j.employment_type ?? "Full-time",
          experience: j.experience ?? "",
          salary_min: j.salary_min != null ? String(j.salary_min) : "",
          salary_max: j.salary_max != null ? String(j.salary_max) : "",
          openings: String(j.openings ?? 1),
          status: j.status ?? "draft",
          description: j.description ?? "",
          requirements: j.requirements ?? "",
          responsibilities: j.responsibilities ?? "",
        });
      })
      .catch((err) => setError(err?.message ?? "Failed to load job"))
      .finally(() => setLoading(false));
  }, [jobId]);

  const set = (key: keyof JobFormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      department: form.department || null,
      location: form.location || null,
      employment_type: form.employment_type || null,
      experience: form.experience || null,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
      openings: Number(form.openings || 1),
      status: form.status as HRJob["status"],
      description: form.description || null,
      requirements: form.requirements || null,
      responsibilities: form.responsibilities || null,
    };

    try {
      if (isEdit && jobId) {
        await hrService.updateJob(jobId, payload);
      } else {
        await hrService.createJob(payload);
      }
      navigate({ to: "/hr/jobs" });
    } catch (err: any) {
      setError(err?.message ?? err?.errors ? "Validation failed" : "Could not save job");
    } finally {
      setSaving(false);
    }
  };

  return (
    <HrLayout
      title={isEdit ? "Edit Job" : "Create Job"}
      subtitle={isEdit ? "Update opening details" : "Add a new role to your hiring pipeline"}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <form onSubmit={submit} className="max-w-3xl space-y-6">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="title">Job title</Label>
                <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={form.department} onChange={(e) => set("department", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Employment type</Label>
                <Select value={form.employment_type} onValueChange={(v) => set("employment_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Experience</Label>
                <Input value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="e.g. 3-5 years" />
              </div>
              <div className="space-y-2">
                <Label>Salary min</Label>
                <Input type="number" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Salary max</Label>
                <Input type="number" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Openings</Label>
                <Input type="number" min={1} value={form.openings} onChange={(e) => set("openings", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="on_hold">On hold</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea rows={4} value={form.requirements} onChange={(e) => set("requirements", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Responsibilities</Label>
              <Textarea rows={4} value={form.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="brand" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Update job" : "Create job"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/hr/jobs" })}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </HrLayout>
  );
}
