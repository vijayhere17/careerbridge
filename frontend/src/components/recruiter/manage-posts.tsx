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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { posts } from "@/data/recruiter";
import {
  Search,
  Eye,
  Pencil,
  Copy,
  Pause,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ManagePosts() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(
    () =>
      posts.filter((p) => {
        return (
          (!q || p.title.toLowerCase().includes(q.toLowerCase())) &&
          (cat === "all" || p.type === cat) &&
          (status === "all" || p.status === status)
        );
      }),
    [q, cat, status],
  );

  return (
    <RecruiterLayout
      title="Manage Posts"
      subtitle="Edit, pause and track every opportunity you've posted"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/recruiter/post-new">
            <Plus className="h-4 w-4" /> New Post
          </Link>
        </Button>
      }
    >
      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="Job">Job</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Freelance">Freelance</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Applications</TableHead>
                <TableHead className="text-right">Unlocks</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.location} · {p.mode}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{p.type}</span>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={p.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium">{p.applications}</TableCell>
                  <TableCell className="text-right">{p.unlocks}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.posted}</TableCell>
                  <TableCell className="text-right">{p.views.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn title="View">
                        <Eye className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn title="Edit">
                        <Pencil className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn title="Duplicate">
                        <Copy className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn title="Pause">
                        <Pause className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn title="Delete" danger>
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn title="More">
                        <MoreHorizontal className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden space-y-4 p-4">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.location} · {p.mode}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {p.type} · {p.status}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{p.applications}</p>
                  <p className="text-xs text-muted-foreground">Apps</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-2 py-1">Unlocks {p.unlocks}</span>
                <span className="rounded-full bg-muted px-2 py-1">
                  Views {p.views.toLocaleString()}
                </span>
                <span className="rounded-full bg-muted px-2 py-1">Posted {p.posted}</span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button className="w-full" variant="outline" size="sm">
                  View
                </Button>
                <Button className="w-full" variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            Showing 1–{filtered.length} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
}

function IconBtn({
  children,
  title,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent hover:bg-muted ${danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Published: "bg-secondary-soft text-secondary",
    Draft: "bg-muted text-muted-foreground",
    Paused: "bg-accent-soft text-accent-foreground",
    Closed: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status}</span>
  );
}
