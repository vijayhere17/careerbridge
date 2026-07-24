import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { HrLayout } from "@/components/hr/HrLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hrService, PIPELINE_STAGES, stageLabel } from "@/services/hrService";
import { cn } from "@/lib/utils";

type PipelineApp = {
  id: number;
  current_stage: string;
  rating?: number | null;
  candidate?: { id: number; name: string; email?: string; experience?: string };
  job?: { id: number; title: string; department?: string };
};

export function HrPipelinePage() {
  const [columns, setColumns] = useState<Record<string, { applications: PipelineApp[]; count: number }>>({});
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobId, setJobId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrService.pipeline(jobId === "all" ? undefined : Number(jobId));
      setColumns(res.data.columns);
      setJobs(res.data.jobs ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobId]);

  const onDrop = async (stage: string) => {
    if (!draggingId) return;
    try {
      await hrService.movePipeline(draggingId, stage);
      setDraggingId(null);
      load();
    } catch (err: any) {
      setError(err?.message ?? "Could not move candidate");
    }
  };

  return (
    <HrLayout
      title="Hiring Pipeline"
      subtitle="Drag candidates across stages"
      actions={
        <Select value={jobId} onValueChange={setJobId}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Filter job" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All open jobs</SelectItem>
            {jobs.map((j) => (
              <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading pipeline…</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const col = columns[stage];
            const apps = col?.applications ?? [];
            return (
              <div
                key={stage}
                className="min-w-[260px] w-[260px] shrink-0 rounded-2xl border border-border bg-muted/20"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(stage)}
              >
                <div className="flex items-center justify-between px-3 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold">{stageLabel(stage)}</h3>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium border border-border">
                    {col?.count ?? 0}
                  </span>
                </div>
                <div className="space-y-2 p-2 min-h-[420px]">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={() => setDraggingId(app.id)}
                      className={cn(
                        "cursor-grab rounded-xl border border-border bg-card p-3 shadow-card active:cursor-grabbing",
                        draggingId === app.id && "opacity-60",
                      )}
                    >
                      <p className="font-medium text-sm">{app.candidate?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{app.job?.title}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {app.candidate?.experience ?? "Experience N/A"}
                        </span>
                        {app.candidate?.id && (
                          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                            <Link to={`/hr/candidates/${app.candidate.id}`}>View</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </HrLayout>
  );
}
