import { Link } from "@tanstack/react-router";
import { RecruiterLayout } from "@/components/recruiter/RecruiterLayout";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  Coins,
  Wallet,
  ArrowUpRight,
  Plus,
  Zap,
  GraduationCap,
  Laptop,
  Flame,
  CalendarClock,
  BellDot,
  CheckCircle2,
} from "lucide-react";
import {
  recruiterProfile,
  recruiterStats,
  posts,
  applications,
  notifications,
} from "@/data/recruiter";

const statCards = [
  {
    label: "Total Active Posts",
    value: recruiterStats.activePosts,
    delta: "+3 this week",
    icon: Briefcase,
    tint: "text-primary bg-primary-soft",
  },
  {
    label: "Applications Received",
    value: recruiterStats.applications,
    delta: "+42 today",
    icon: Users,
    tint: "text-secondary bg-secondary-soft",
  },
  {
    label: "Today's Unlock Earnings",
    value: `₹${recruiterStats.todayUnlockEarnings.toLocaleString()}`,
    delta: "+18% vs yesterday",
    icon: Coins,
    tint: "text-accent bg-accent-soft",
  },
  {
    label: "Wallet Balance",
    value: `₹${recruiterStats.walletBalance.toLocaleString()}`,
    delta: "Ready to withdraw",
    icon: Wallet,
    tint: "text-primary bg-primary-soft",
  },
];

const quickActions = [
  { label: "Post New Job", icon: Briefcase, tint: "bg-primary-soft text-primary" },
  { label: "Post Internship", icon: GraduationCap, tint: "bg-secondary-soft text-secondary" },
  { label: "Post Freelance Project", icon: Laptop, tint: "bg-accent-soft text-accent" },
  { label: "Post Urgent Hiring", icon: Flame, tint: "bg-destructive/10 text-destructive" },
];

const interviews = [
  { name: "Arjun Mehta", role: "DevOps Lead", when: "Today · 4:00 PM", mode: "Google Meet" },
  { name: "Priya Nair", role: "Design Intern", when: "Tomorrow · 11:30 AM", mode: "Zoom" },
  { name: "Ishita Roy", role: "Sr React Engineer", when: "Jul 3 · 6:00 PM", mode: "Google Meet" },
];

export function RecruiterDashboard() {
  return (
    <RecruiterLayout
      title="Dashboard"
      subtitle="Overview of your hiring activity"
      actions={
        <Button asChild variant="brand" size="sm">
          <Link to="/recruiter/post-new">
            <Plus className="h-4 w-4" /> Post Opportunity
          </Link>
        </Button>
      }
    >
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border gradient-hero p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={recruiterProfile.avatar}
              alt=""
              className="h-14 w-14 rounded-full ring-2 ring-primary/30 object-cover"
            />
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {recruiterProfile.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{recruiterProfile.company}</span>
                {recruiterProfile.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary-soft px-2 py-0.5 text-xs font-medium text-secondary">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/recruiter/profile">View profile</Link>
            </Button>
            <Button asChild size="sm" variant="brand">
              <Link to="/recruiter/applications">Review applications</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${c.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{c.label}</p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">{c.value}</p>
              <p className="mt-1 text-xs text-secondary">{c.delta}</p>
            </div>
          );
        })}
      </section>

      {/* Second section */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent applications */}
        <div className="rounded-2xl border border-border bg-card shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-semibold">Recent Applications</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/recruiter/applications">View all</Link>
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {applications.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <img src={a.photo} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.role} · {a.experience}
                  </p>
                </div>
                <span className="hidden sm:inline text-xs text-muted-foreground">{a.applied}</span>
                <StatusPill status={a.status} />
              </li>
            ))}
          </ul>
        </div>

        {/* Upcoming interviews */}
        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-semibold">Upcoming Interviews</h3>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="divide-y divide-border">
            {interviews.map((i) => (
              <li key={i.name} className="px-5 py-3">
                <p className="text-sm font-semibold">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.role}</p>
                <p className="mt-1 text-xs text-primary">
                  {i.when} · {i.mode}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Latest posts + notifications */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card shadow-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-semibold">Latest Posts</h3>
            <Button asChild variant="ghost" size="sm">
              <Link to="/recruiter/manage-posts">Manage</Link>
            </Button>
          </div>
          <ul className="divide-y divide-border">
            {posts.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Briefcase className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.type} · {p.location} · {p.mode}
                  </p>
                </div>
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  {p.applications} apps
                </span>
                <PostStatusPill status={p.status} />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="font-semibold">Recent Notifications</h3>
            <BellDot className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="divide-y divide-border">
            {notifications.slice(0, 4).map((n) => (
              <li key={n.id} className="px-5 py-3">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.label}
                to="/recruiter/post-new"
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${a.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">Start a new post</p>
                </div>
              </Link>
            );
          })}
        </div>
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
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

function PostStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Published: "bg-secondary-soft text-secondary",
    Draft: "bg-muted text-muted-foreground",
    Paused: "bg-accent-soft text-accent-foreground",
    Closed: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
