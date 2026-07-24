import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, StickyNote, Trash2 } from "lucide-react";
import { HrLayout } from "@/components/hr/HrLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { hrService, stageLabel } from "@/services/hrService";

export function HrCandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await hrService.listCandidates({ page, search, per_page: 12 });
      setCandidates(res.data.data);
      setLastPage(res.data.last_page);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  return (
    <HrLayout title="Candidates" subtitle="People in your hiring pipeline">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
        className="flex gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search candidates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && candidates.length === 0 && (
          <p className="text-sm text-muted-foreground">No candidates in your pipeline yet.</p>
        )}
        {candidates.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary font-semibold">
                {(c.name ?? "?").slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">{c.email}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>{c.applications_count} applications</span>
              <span>{c.latest_stage ? stageLabel(c.latest_stage) : "—"}</span>
              <span>{c.location ?? "Location N/A"}</span>
              <span>Rating {c.avg_rating || "—"}</span>
            </div>
            <Button asChild className="mt-4 w-full" variant="outline" size="sm">
              <Link to={`/hr/candidates/${c.id}`}>View profile</Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {lastPage}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </HrLayout>
  );
}

export function HrCandidateDetailPage({ candidateId }: { candidateId: number }) {
  const [data, setData] = useState<any>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.getCandidate(candidateId);
      setData(res.data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load candidate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [candidateId]);

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await hrService.addCandidateNote(candidateId, note.trim());
      setNote("");
      load();
    } finally {
      setSaving(false);
    }
  };

  const removeNote = async (noteId: number) => {
    await hrService.deleteCandidateNote(candidateId, noteId);
    load();
  };

  const c = data?.candidate;

  return (
    <HrLayout title={c?.name ?? "Candidate"} subtitle="Professional profile and hiring history">
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {c && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary text-2xl font-bold">
                  {c.name.slice(0, 1)}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">{c.name}</h2>
                  <p className="text-sm text-muted-foreground">{c.email} · {c.mobile ?? "No phone"}</p>
                  <p className="mt-1 text-sm">{c.current_role ?? "Professional"} {c.company ? `@ ${c.company}` : ""}</p>
                  <p className="text-sm text-muted-foreground">{c.location}</p>
                </div>
              </div>
              {c.bio && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{c.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {(c.skills ?? []).map((skill: string) => (
                  <span key={skill} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-card grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Experience</h3>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{c.experience || "Not provided"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Education</h3>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{c.education || "Not provided"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Portfolio</h3>
                <p className="mt-1 text-sm text-muted-foreground break-all">{c.portfolio || "—"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Links</h3>
                <p className="mt-1 text-sm text-muted-foreground break-all">
                  LinkedIn: {c.linkedin || "—"}
                  <br />
                  GitHub: {c.github || "—"}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-display text-lg font-semibold">Applications</h3>
              <div className="mt-3 space-y-2">
                {(data.applications ?? []).map((app: any) => (
                  <div key={app.id} className="rounded-xl border border-border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{app.job?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {stageLabel(app.current_stage)} · Rating {app.rating ?? "—"}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/hr/pipeline">Pipeline</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-semibold">Ratings</h3>
              <p className="mt-2 font-display text-3xl font-bold">{data.ratings?.average || 0}</p>
              <p className="text-xs text-muted-foreground">{data.ratings?.count || 0} ratings</p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-semibold mb-3">Interview history</h3>
              <div className="space-y-2">
                {(data.interviews ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No interviews yet.</p>
                )}
                {(data.interviews ?? []).map((iv: any) => (
                  <div key={iv.id} className="rounded-xl border border-border p-3 text-sm">
                    <p className="font-medium">{iv.interview_type ?? "Interview"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(iv.scheduled_at).toLocaleString()} · {iv.status}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Notes</h3>
              </div>
              <Textarea
                rows={3}
                placeholder="Add an internal note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button className="mt-2" size="sm" variant="brand" disabled={saving} onClick={addNote}>
                {saving ? "Saving…" : "Add note"}
              </Button>
              <div className="mt-4 space-y-2">
                {(data.notes ?? []).map((n: any) => (
                  <div key={n.id} className="rounded-xl border border-border p-3">
                    <div className="flex justify-between gap-2">
                      <p className="text-sm">{n.note}</p>
                      <button type="button" onClick={() => removeNote(n.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </HrLayout>
  );
}
