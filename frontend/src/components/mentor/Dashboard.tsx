import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { apiFetch } from "@/lib/auth";

import {
  CalendarDays,
  Wallet,
  Bell,
  BriefcaseBusiness,
  Clock3,
  HandCoins,
  Star,
  UserCircle2,
  ArrowRight,
  Video,
  Phone,
  MessageCircle,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";

type SessionType = "Video Call" | "Audio Call" | "Chat";

type DashboardSession = {
  id: string;
  candidateName: string;
  candidateInitials: string;
  candidateRole?: string;
  service: string;
  sessionType: SessionType;
  date: string;
  time: string;
  duration: number;
  amount: number;
  status?: string;
};

type DashboardRequest = DashboardSession & {
  requestedAt?: string;
};

type DashboardReview = {
  id: string;
  candidate: string;
  rating: number;
  comment?: string | null;
  service?: string;
  date?: string | null;
};

type MentorDashboardResponse = {
  mentor: {
    name: string;
    designation?: string | null;
    company?: string | null;
    rating: number;
    total_reviews: number;
    total_sessions: number;
    profile_photo?: string | null;
    experience?: string | number | null;
    verified: boolean;
    available: boolean;
    profile_completion: number;
  };
  stats: {
    today_sessions: number;
    pending_requests: number;
    wallet_balance: number;
    monthly_earnings: number;
  };
  earnings: {
    total: number;
    month: number;
    pending: number;
  };
  upcoming_sessions: DashboardSession[];
  pending_requests: DashboardRequest[];
  recent_reviews: DashboardReview[];
};

const SESSION_ICONS: Record<SessionType, React.ElementType> = {
  "Video Call": Video,
  "Audio Call": Phone,
  Chat: MessageCircle,
};

function formatCurrency(value?: number | string | null) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function initials(name?: string | null) {
  return (name ?? "Mentor")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function dateLabel(date: string) {
  const value = new Date(date);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (value.toDateString() === today.toDateString()) return "Today";
  if (value.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function MentorDashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const nav = (page: string) => onNavigate?.(page);

  const [dashboard, setDashboard] = useState<MentorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<MentorDashboardResponse>("/api/mentor/dashboard");
      setDashboard(res);
    } catch (err) {
      console.error(err);
      setError("Dashboard data could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const mentor = dashboard?.mentor;
  const s = dashboard?.stats;
  const earnings = dashboard?.earnings;
  const profileCompletion = Math.min(Math.max(mentor?.profile_completion ?? 0, 0), 100);

  const stats = useMemo(
    () => [
      {
        title: "Today's Sessions",
        value: s?.today_sessions ?? 0,
        icon: CalendarDays,
        tint: "bg-blue-50 text-blue-600",
        nav: "Upcoming Sessions",
      },
      {
        title: "Pending Requests",
        value: s?.pending_requests ?? 0,
        icon: Bell,
        tint: "bg-amber-50 text-amber-600",
        nav: "Incoming Requests",
      },
      {
        title: "Wallet Balance",
        value: formatCurrency(s?.wallet_balance),
        icon: Wallet,
        tint: "bg-emerald-50 text-emerald-600",
        nav: "Wallet",
      },
      {
        title: "Monthly Earnings",
        value: formatCurrency(s?.monthly_earnings),
        icon: HandCoins,
        tint: "bg-violet-50 text-violet-600",
        nav: "Earnings",
      },
    ],
    [s]
  );

  const quickActions = [
    { title: "Services", icon: BriefcaseBusiness, nav: "Services" },
    { title: "Availability", icon: CalendarDays, nav: "Availability" },
    { title: "Sessions", icon: Clock3, nav: "Upcoming Sessions" },
    { title: "Wallet", icon: Wallet, nav: "Wallet" },
    { title: "Withdraw", icon: HandCoins, nav: "Withdraw Request" },
    { title: "Profile", icon: UserCircle2, nav: "Profile" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 lg:px-8">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </span>
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative shrink-0">
              <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-primary text-lg font-bold text-primary-foreground sm:h-20 sm:w-20 sm:text-2xl">
                {mentor?.profile_photo ? (
                  <img src={mentor.profile_photo} alt={mentor.name} className="h-full w-full object-cover" />
                ) : (
                  initials(mentor?.name)
                )}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-surface ${
                  mentor?.available ? "bg-emerald-500" : "bg-muted-foreground"
                }`}
              />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Mentor Dashboard
              </p>
              <h1 className="mt-0.5 truncate text-xl font-bold text-foreground sm:text-2xl">
                Good morning, {mentor?.name?.split(" ")[0] ?? "Mentor"}
              </h1>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {mentor?.designation ?? "Add your designation"} · {mentor?.company ?? "Add your company"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{" "}
                  {Number(mentor?.rating ?? 0).toFixed(1)}
                  <span className="text-muted-foreground">({mentor?.total_reviews ?? 0})</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    mentor?.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${mentor?.verified ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {mentor?.verified ? "Verified" : "Verification pending"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                  {mentor?.total_sessions ?? 0} sessions
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
            <button
              onClick={() => nav("Profile")}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:flex-none"
            >
              Edit profile
            </button>
            <button
              onClick={() => nav("Availability")}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:flex-none"
            >
              Manage availability
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Profile completion</span>
            <span className="font-semibold text-foreground">{profileCompletion}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${profileCompletion}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, tint, nav: navTo }) => (
          <button
            key={title}
            onClick={() => nav(navTo)}
            className="group rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          >
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${tint}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
              {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded bg-muted align-middle" /> : value}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{title}</p>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Today's & upcoming schedule
              </p>
              <button onClick={() => nav("Upcoming Sessions")} className="text-xs font-medium text-primary hover:underline">
                Full calendar
              </button>
            </div>

            {loading ? (
              <div className="h-28 animate-pulse rounded-xl bg-muted" />
            ) : !dashboard?.upcoming_sessions?.length ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarDays className="h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No confirmed sessions scheduled yet.</p>
              </div>
            ) : (
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
                {dashboard.upcoming_sessions.map((session) => {
                  const Icon = SESSION_ICONS[session.sessionType] ?? Video;
                  return (
                    <div key={session.id} className="flex min-w-[190px] shrink-0 flex-col gap-2.5 rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">{session.time}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {dateLabel(session.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                          {session.candidateInitials || initials(session.candidateName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{session.candidateName}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{session.service}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Icon className="h-3 w-3" /> {session.sessionType} · {session.duration} min
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pending requests
              </p>
              <button onClick={() => nav("Incoming Requests")} className="text-xs font-medium text-primary hover:underline">
                View all
              </button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : !dashboard?.pending_requests?.length ? (
              <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                No pending booking requests.
              </div>
            ) : (
              <div className="space-y-2">
                {dashboard.pending_requests.map((request) => (
                  <div key={request.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
                      {request.candidateInitials || initials(request.candidateName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{request.candidateName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {request.service} · {dateLabel(request.date)} · {request.time}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{formatCurrency(request.amount)}</span>
                      <button
                        onClick={() => nav("Incoming Requests")}
                        className="rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Quick actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(({ title, icon: Icon, nav: navTo }) => (
                <button
                  key={title}
                  onClick={() => nav(navTo)}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate text-xs font-semibold text-foreground">{title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Earnings
              </p>
              <button onClick={() => nav("Earnings")} className="text-xs font-medium text-primary hover:underline">
                Details
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Total", value: formatCurrency(earnings?.total) },
                { label: "This month", value: formatCurrency(earnings?.month) },
                { label: "Pending", value: formatCurrency(earnings?.pending) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-muted p-2.5 text-center">
                  <p className="text-sm font-bold text-foreground">{loading ? "…" : value}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => nav("Withdraw Request")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <HandCoins className="h-4 w-4" /> Request withdrawal
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent reviews
              </p>
              <button onClick={() => nav("Reviews")} className="text-xs font-medium text-primary hover:underline">
                View all
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : !dashboard?.recent_reviews?.length ? (
              <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                No candidate reviews yet.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recent_reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-border p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-foreground">{review.candidate}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {review.comment || "No written feedback."}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {review.service ?? "Mentoring Session"} · {review.date ?? "Recently"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
