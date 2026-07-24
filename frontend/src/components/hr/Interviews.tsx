import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Link2, Plus } from "lucide-react";
import { HrLayout } from "@/components/hr/HrLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hrService, type HRApplication, type HRInterview } from "@/services/hrService";

export function HrInterviewsPage() {
  const [interviews, setInterviews] = useState<HRInterview[]>([]);
  const [applications, setApplications] = useState<HRApplication[]>([]);
  const [tab, setTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    application_id: "",
    interviewer_name: "",
    interview_type: "Technical",
    meeting_link: "",
    scheduled_at: "",
    duration: "45",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [ivRes, appRes] = await Promise.all([
        hrService.listInterviews({ per_page: 100 }),
        hrService.listApplications({ per_page: 100 }),
      ]);
      setInterviews(ivRes.data.data);
      setApplications(appRes.data.data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (tab === "upcoming") {
      return interviews.filter((i) => i.status === "scheduled" && new Date(i.scheduled_at) >= new Date());
    }
    if (tab === "completed") return interviews.filter((i) => i.status === "completed");
    if (tab === "cancelled") return interviews.filter((i) => i.status === "cancelled" || i.status === "no_show");
    return interviews;
  }, [interviews, tab]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrService.createInterview({
        application_id: Number(form.application_id),
        interviewer_name: form.interviewer_name || undefined,
        interview_type: form.interview_type,
        meeting_link: form.meeting_link || undefined,
        scheduled_at: form.scheduled_at,
        duration: Number(form.duration),
      });
      setShowForm(false);
      setForm({
        application_id: "",
        interviewer_name: "",
        interview_type: "Technical",
        meeting_link: "",
        scheduled_at: "",
        duration: "45",
      });
      load();
    } catch (err: any) {
      setError(err?.message ?? "Could not schedule interview");
    } finally {
      setSaving(false);
    }
  };

  const complete = async (id: number) => {
    const feedback = prompt("Interview feedback (optional)") ?? undefined;
    await hrService.updateInterview(id, { status: "completed", feedback });
    load();
  };

  const cancel = async (id: number) => {
    await hrService.updateInterview(id, { status: "cancelled" });
    load();
  };

  return (
    <HrLayout
      title="Interviews"
      subtitle="Schedule, track and capture interview feedback"
      actions={
        <Button variant="brand" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" /> Schedule
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={create} className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <Label>Application</Label>
            <Select value={form.application_id} onValueChange={(v) => setForm((f) => ({ ...f, application_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select candidate application" /></SelectTrigger>
              <SelectContent>
                {applications.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.candidate?.name} · {a.job?.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Interviewer</Label>
            <Input value={form.interviewer_name} onChange={(e) => setForm((f) => ({ ...f, interviewer_name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.interview_type} onValueChange={(v) => setForm((f) => ({ ...f, interview_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Screening">Screening</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scheduled at</Label>
            <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <Label>Meeting link</Label>
            <Input value={form.meeting_link} onChange={(e) => setForm((f) => ({ ...f, meeting_link: e.target.value }))} placeholder="https://meet.google.com/..." />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" variant="brand" disabled={saving || !form.application_id}>
              {saving ? "Scheduling…" : "Schedule interview"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No interviews in this view</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((iv) => (
                <div key={iv.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{iv.candidate?.name}</p>
                      <p className="text-sm text-muted-foreground">{iv.job?.title}</p>
                    </div>
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                      {iv.status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>{new Date(iv.scheduled_at).toLocaleString()} · {iv.duration} min</p>
                    <p>{iv.interview_type} · {iv.interviewer_name || "Interviewer TBD"}</p>
                    {iv.meeting_link && (
                      <a href={iv.meeting_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Link2 className="h-3.5 w-3.5" /> Meeting link
                      </a>
                    )}
                    {iv.feedback && <p className="pt-2 text-foreground">Feedback: {iv.feedback}</p>}
                  </div>
                  {iv.status === "scheduled" && (
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="brand" onClick={() => complete(iv.id)}>Complete</Button>
                      <Button size="sm" variant="outline" onClick={() => cancel(iv.id)}>Cancel</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </HrLayout>
  );
}
