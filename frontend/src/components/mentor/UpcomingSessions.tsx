
import { useEffect, useState } from "react";
import {
  Video, Phone, MessageCircle, Clock, Calendar,
  CheckCircle2, X, ChevronRight, ExternalLink,
  User, AlertCircle, DollarSign, Copy, Check,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

type SessionType = "Video Call" | "Audio Call" | "Chat";

interface Session {
  id: string;
  candidateName: string;
  candidateInitials: string;
  candidateRole: string;
  service: string;
  sessionType: SessionType;
  date: string;
  time: string;
  duration: number;
  amount: number;
  meetLink?: string;
  requirements?: string;
}

const MOCK_SESSIONS: Session[] = [
  {
    id: "us1",
    candidateName: "Rohan Mehta",
    candidateInitials: "RM",
    candidateRole: "Software Engineer, 3 yrs",
    service: "PM Mock Interview",
    sessionType: "Video Call",
    date: "2025-07-20",
    time: "11:00 AM",
    duration: 60,
    amount: 1499,
    meetLink: "https://meet.google.com/abc-defg-hij",
    requirements: "Focus on product sense and estimation questions for Google PM role.",
  },
  {
    id: "us2",
    candidateName: "Sneha Kapoor",
    candidateInitials: "SK",
    candidateRole: "MBA Student",
    service: "Career Guidance Session",
    sessionType: "Audio Call",
    date: "2025-07-22",
    time: "04:00 PM",
    duration: 30,
    amount: 699,
    requirements: "Transitioning from MBA to product management.",
  },
  {
    id: "us3",
    candidateName: "Arjun Patel",
    candidateInitials: "AP",
    candidateRole: "Product Manager, 2 yrs",
    service: "Resume & Portfolio Review",
    sessionType: "Video Call",
    date: "2025-07-24",
    time: "10:00 AM",
    duration: 45,
    amount: 999,
    meetLink: "https://meet.google.com/xyz-uvwx-yz1",
  },
  {
    id: "us4",
    candidateName: "Prachi Shah",
    candidateInitials: "PS",
    candidateRole: "Business Analyst, 4 yrs",
    service: "Quick Chat",
    sessionType: "Chat",
    date: "2025-07-26",
    time: "02:00 PM",
    duration: 15,
    amount: 299,
  },
];

const SESSION_ICONS: Record<SessionType, React.ElementType> = {
  "Video Call": Video,
  "Audio Call": Phone,
  "Chat":       MessageCircle,
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function isToday(d: string) {
  return new Date(d).toDateString() === new Date().toDateString();
}

function isTomorrow(d: string) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return new Date(d).toDateString() === tomorrow.toDateString();
}

function dateLabel(d: string) {
  if (isToday(d))    return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return formatDate(d);
}

function DetailDrawer({ session, onClose, onComplete }: {
  session: Session;
  onClose: () => void;
  onComplete: (id: string) => void;
}) {
  const Icon = SESSION_ICONS[session.sessionType];
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (session.meetLink) {
      navigator.clipboard.writeText(session.meetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 lg:items-stretch" onClick={onClose}>
      <div
        className="relative flex h-[90vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-surface lg:h-full lg:w-[420px] lg:rounded-none lg:rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <span className="font-semibold text-sm">Session Details</span>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-border p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-base font-bold text-primary">
              {session.candidateInitials}
            </div>
            <div>
              <p className="font-bold text-sm">{session.candidateName}</p>
              <p className="text-xs text-muted-foreground">{session.candidateRole}</p>
              <p className="text-xs font-semibold text-primary mt-0.5">{session.service}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Calendar,    label: "Date",     value: dateLabel(session.date) },
              { icon: Clock,       label: "Time",     value: `${session.time} · ${session.duration} min` },
              { icon: Icon,        label: "Type",     value: session.sessionType },
              { icon: DollarSign,  label: "Earnings", value: `₹${session.amount.toLocaleString()} (escrow)` },
            ].map(({ icon: I, label, value }) => (
              <div key={label} className="rounded-xl border border-border p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <I className="h-3 w-3" /> {label}
                </p>
                <p className="text-xs font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {session.requirements && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Candidate's Requirements
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">"{session.requirements}"</p>
            </div>
          )}

          {session.meetLink && (
            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Meeting Link
              </p>
              <p className="text-xs text-muted-foreground truncate">{session.meetLink}</p>
              <div className="flex gap-2">
                <a
                  href={session.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open Link
                </a>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-muted p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mark the session as complete after it ends to release ₹{session.amount.toLocaleString()} to your wallet.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-border bg-surface p-4 flex gap-2">
          {session.meetLink && (
            <a
              href={session.meetLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              <ExternalLink className="h-4 w-4" /> Join
            </a>
          )}
          <button
            onClick={() => { onComplete(session.id); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" /> Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionCard({ session, onView }: {
  session: Session;
  onView: () => void;
}) {
  const Icon = SESSION_ICONS[session.sessionType];
  const today    = isToday(session.date);
  const tomorrow = isTomorrow(session.date);

  return (
    <div className={`rounded-xl border bg-surface p-4 transition-all hover:border-primary/30 ${today ? "border-primary/40 bg-primary/[0.02]" : "border-border"}`}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {session.candidateInitials}
          </div>
          {today && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-surface animate-pulse" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{session.candidateName}</p>
              <p className="text-xs text-muted-foreground">{session.service}</p>
            </div>
            {(today || tomorrow) && (
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                today
                  ? "bg-primary text-primary-foreground"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {today ? "Today" : "Tomorrow"}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" /> {formatDate(session.date)}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" /> {session.time} · {session.duration} min
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Icon className="h-3 w-3" /> {session.sessionType}
            </span>
            <span className="text-[11px] font-bold text-primary">₹{session.amount.toLocaleString()}</span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {session.meetLink && (
              <a
                href={session.meetLink}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-3 w-3" /> Join
              </a>
            )}
            <button
              onClick={onView}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline ml-auto"
            >
              Details <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MentorUpcomingSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Session | null>(null);

  useEffect(() => {
  async function loadSessions() {
    try {
      const data = await apiFetch<{
        sessions: Session[];
      }>("/api/mentor/upcoming-sessions");

      setSessions(data.sessions);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  loadSessions();
}, []);

  const handleComplete = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const todaySessions    = sessions.filter((s) => isToday(s.date));
  const upcomingSessions = sessions.filter((s) => !isToday(s.date));
  const totalEarnings    = sessions.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Sessions", value: sessions.length },
          { label: "Today",          value: todaySessions.length },
          { label: "Pending Earnings", value: `₹${totalEarnings.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <p className="text-sm text-muted-foreground">
      Loading upcoming sessions...
    </p>
  </div>
) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted mb-3">
            <Calendar className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No upcoming sessions</p>
          <p className="text-xs text-muted-foreground mt-1">Accepted bookings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {todaySessions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Today</p>
              <div className="space-y-3">
                {todaySessions.map((s) => (
                  <SessionCard key={s.id} session={s} onView={() => setSelected(s)} />
                ))}
              </div>
            </div>
          )}

          {upcomingSessions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Upcoming</p>
              <div className="space-y-3">
                {upcomingSessions.map((s) => (
                  <SessionCard key={s.id} session={s} onView={() => setSelected(s)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selected && (
        <DetailDrawer
          session={selected}
          onClose={() => setSelected(null)}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
