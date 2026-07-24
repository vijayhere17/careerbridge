import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Star } from "lucide-react";
import { HrLayout } from "@/components/hr/HrLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  hrService,
  PIPELINE_STAGES,
  stageLabel,
  type HRApplication,
  type HRJob,
} from "@/services/hrService";
import { cn } from "@/lib/utils";

export function HrApplicationsPage() {
  const [apps, setApps] = useState<HRApplication[]>([]);
  const [jobs, setJobs] = useState<HRJob[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("all");
  const [jobId, setJobId] = useState("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulkStage, setBulkStage] = useState("screening");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [appsRes, jobsRes] = await Promise.all([
        hrService.listApplications({
          page,
          search,
          stage: stage === "all" ? undefined : stage,
          job_id: jobId === "all" ? undefined : jobId,
          per_page: 15,
        }),
        hrService.listJobs({ per_page: 100 }),
      ]);
      setApps(appsRes.data.data);
      setLastPage(appsRes.data.last_page);
      setJobs(jobsRes.data.data);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, stage, jobId]);

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.length === apps.length ? [] : apps.map((a) => a.id)));
  };

  const rate = async (id: number, rating: number) => {
    await hrService.updateApplication(id, { rating });
    load();
  };

  const bulkMove = async () => {
    if (!selected.length) return;
    await hrService.bulkUpdateApplications({ ids: selected, current_stage: bulkStage });
    setSelected([]);
    load();
  };

  return (
    <HrLayout title="Applications" subtitle="Review candidates and manage hiring stages">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
        className="flex flex-col lg:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search candidate name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={stage} onValueChange={(v) => { setStage(v); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {PIPELINE_STAGES.map((s) => (
              <SelectItem key={s} value={s}>{stageLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={jobId} onValueChange={(v) => { setJobId(v); setPage(1); }}>
          <SelectTrigger className="w-full lg:w-56"><SelectValue placeholder="Job" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All jobs</SelectItem>
            {jobs.map((j) => (
              <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      {selected.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-sm font-medium">{selected.length} selected</p>
          <Select value={bulkStage} onValueChange={setBulkStage}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s} value={s}>{stageLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="brand" onClick={bulkMove}>Move selected</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={selected.length === apps.length && apps.length > 0} onChange={toggleAll} />
                </th>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Applied</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-muted-foreground">Loading…</td></tr>
              ) : apps.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-muted-foreground">No applications found.</td></tr>
              ) : (
                apps.map((app) => (
                  <tr key={app.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(app.id)} onChange={() => toggle(app.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{app.candidate?.name}</p>
                        <p className="text-xs text-muted-foreground">{app.candidate?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{app.job?.title}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                        {stageLabel(app.current_stage)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} type="button" onClick={() => rate(app.id, n)}>
                            <Star
                              className={cn(
                                "h-4 w-4",
                                (app.rating ?? 0) >= n ? "fill-accent text-accent" : "text-muted-foreground",
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {app.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/hr/candidates/${app.candidate_id}`}>Profile</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {lastPage}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>
    </HrLayout>
  );
}
