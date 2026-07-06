import { useMemo, useState } from "react";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applications } from "@/data/recruiter";
import {
  Users,
  CheckCircle2,
  CalendarClock,
  XCircle,
  Search,
  Eye,
  MessageSquare,
  Star,
  X,
  FileText,
} from "lucide-react";

const stats = [
  {
    label: "Total Applications",
    value: applications.length,
    icon: Users,
    tint: "bg-primary-soft text-primary",
  },
  {
    label: "Shortlisted",
    value: applications.filter((a) => a.status === "Shortlisted").length,
    icon: Star,
    tint: "bg-secondary-soft text-secondary",
  },
  {
    label: "Interview Scheduled",
    value: applications.filter((a) => a.status === "Interview").length,
    icon: CalendarClock,
    tint: "bg-accent-soft text-accent-foreground",
  },
  {
    label: "Rejected",
    value: applications.filter((a) => a.status === "Rejected").length,
    icon: XCircle,
    tint: "bg-destructive/10 text-destructive",
  },
];

export function ApplicationsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(
    () =>
      applications.filter(
        (a) =>
          (!q ||
            a.name.toLowerCase().includes(q.toLowerCase()) ||
            a.role.toLowerCase().includes(q.toLowerCase())) &&
          (status === "all" || a.status === status),
      ),
    [q, status],
  );

  return (
    <RecruiterLayout
      title="Applications Received"
      subtitle="Review, shortlist and schedule interviews"
    >
      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
              <p className="font-display text-2xl font-bold">{s.value}</p>
            </div>
          );
        })}
      </section>

      {/* Filters */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or role..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Shortlisted">Shortlisted</SelectItem>
              <SelectItem value="Interview">Interview</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards */}
      <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((a) => (
          <article
            key={a.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start gap-4">
              <img src={a.photo} alt="" className="h-14 w-14 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {a.role} · {a.experience}
                    </p>
                  </div>
                  <StatusPill status={a.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.skills.map((s) => (
                    <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> Resume
                  </span>
                  <span>Applied {a.applied}</span>
                  <span className="truncate">Post: {a.post}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              <Button className="w-full" variant="outline" size="sm">
                <Eye className="h-4 w-4" /> View
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                <CalendarClock className="h-4 w-4" /> Schedule
              </Button>
              <Button className="w-full" variant="outline" size="sm">
                <MessageSquare className="h-4 w-4" /> Message
              </Button>
              <Button className="w-full" size="sm" variant="brand">
                <CheckCircle2 className="h-4 w-4" /> Shortlist
              </Button>
              <Button
                className="w-full text-destructive hover:bg-destructive/10"
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" /> Reject
              </Button>
            </div>
          </article>
        ))}
      </section>
    </RecruiterLayout>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    New: "bg-primary-soft text-primary",
    Shortlisted: "bg-secondary-soft text-secondary",
    Interview: "bg-accent-soft text-accent-foreground",
    Rejected: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status}</span>
  );
}
