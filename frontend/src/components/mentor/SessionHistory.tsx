import { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MessageCircle,
  Search,
  Star,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Receipt,
  ChevronRight,
  User,
  IndianRupee,
} from "lucide-react";

type SessionType = "Video Call" | "Audio Call" | "Chat";

type SessionStatus =
  | "Completed"
  | "Cancelled"
  | "Refunded"
  | "No Show";

interface HistorySession {
  id: string;

  candidateName: string;

  candidateInitials: string;

  candidateRole: string;

  company: string;

  service: string;

  sessionType: SessionType;

  status: SessionStatus;

  rating: number;

  amount: number;

  duration: number;

  date: string;

  time: string;

  mentorNotes: string;

  candidateReview: string;

  completedAt: string;
}

const HISTORY: HistorySession[] = [
  {
    id: "1",

    candidateName: "Rahul Sharma",

    candidateInitials: "RS",

    candidateRole: "Backend Developer",

    company: "Google",

    service: "Mock Interview",

    sessionType: "Video Call",

    status: "Completed",

    rating: 5,

    amount: 1499,

    duration: 60,

    date: "2026-06-12",

    time: "11:00 AM",

    mentorNotes:
      "Strong in Laravel. Needs more confidence in DSA.",

    candidateReview:
      "Excellent mentor. Helped me crack the interview.",

    completedAt: "12 Jun 2026 12:15 PM",
  },

  {
    id: "2",

    candidateName: "Priya Shah",

    candidateInitials: "PS",

    candidateRole: "Frontend Developer",

    company: "Adobe",

    service: "Resume Review",

    sessionType: "Video Call",

    status: "Completed",

    rating: 5,

    amount: 999,

    duration: 45,

    date: "2026-06-15",

    time: "3:00 PM",

    mentorNotes:
      "Resume improved significantly.",

    candidateReview:
      "Very detailed feedback.",

    completedAt: "15 Jun 2026 3:50 PM",
  },

  {
    id: "3",

    candidateName: "Amit Patel",

    candidateInitials: "AP",

    candidateRole: "Java Developer",

    company: "Infosys",

    service: "Career Guidance",

    sessionType: "Audio Call",

    status: "Cancelled",

    rating: 0,

    amount: 0,

    duration: 30,

    date: "2026-06-18",

    time: "5:00 PM",

    mentorNotes:
      "Candidate cancelled.",

    candidateReview: "",

    completedAt: "-",
  },

  {
    id: "4",

    candidateName: "Neha Gupta",

    candidateInitials: "NG",

    candidateRole: "QA Engineer",

    company: "TCS",

    service: "Mock Interview",

    sessionType: "Video Call",

    status: "Refunded",

    rating: 4,

    amount: 999,

    duration: 60,

    date: "2026-06-20",

    time: "10:30 AM",

    mentorNotes:
      "Refund requested.",

    candidateReview:
      "Good session.",

    completedAt: "20 Jun 2026",
  },
];


const SESSION_ICONS: Record<SessionType, React.ElementType> = {
  "Video Call": Video,
  "Audio Call": Phone,
  Chat: MessageCircle,
};

const STATUS_COLORS: Record<SessionStatus, string> = {
  Completed:
    "bg-green-50 text-green-700 border-green-200",

  Cancelled:
    "bg-red-50 text-red-700 border-red-200",

  Refunded:
    "bg-orange-50 text-orange-700 border-orange-200",

  "No Show":
    "bg-gray-100 text-gray-700 border-gray-200",
};

export function MentorSessionHistory() {
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<
    SessionStatus | "All"
  >("All");

  const sessions = useMemo(() => {
    return HISTORY.filter((item) => {

      const matchName =
        item.candidateName
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchStatus =
        status === "All" ||
        item.status === status;

      return matchName && matchStatus;
    });

  }, [search, status]);

  const totalSessions = sessions.filter(
    s => s.status === "Completed"
  ).length;

  const totalEarnings = sessions.reduce(
    (sum, s) => sum + s.amount,
    0
  );

  const avgRating =
    sessions
      .filter(s => s.rating > 0)
      .reduce((a, b) => a + b.rating, 0) /
      Math.max(
        sessions.filter(s => s.rating > 0).length,
        1
      );

  return (

    <div className="space-y-6">

      {/* Summary */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {[
          {
            title: "Completed",
            value: totalSessions,
            icon: CheckCircle2,
            color:
              "bg-green-50 text-green-600",
          },

          {
            title: "Earnings",
            value: `₹${totalEarnings.toLocaleString()}`,
            icon: IndianRupee,
            color:
              "bg-blue-50 text-blue-600",
          },

          {
            title: "Rating",
            value: avgRating.toFixed(1),
            icon: Star,
            color:
              "bg-yellow-50 text-yellow-600",
          },

          {
            title: "Success",
            value: "98%",
            icon: RotateCcw,
            color:
              "bg-violet-50 text-violet-600",
          },

        ].map((item) => {

          const Icon = item.icon;

          return (

            <div
              key={item.title}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm"
            >

              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <h2 className="text-2xl font-bold">
                {item.value}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {item.title}
              </p>

            </div>

          );

        })}

      </div>

      {/* Search */}

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search candidate..."
              className="h-11 w-full rounded-xl border border-border pl-10 pr-3 text-sm outline-none focus:border-primary"
            />

          </div>

          <select
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value as any
              )
            }
            className="h-11 rounded-xl border border-border px-4 text-sm"
          >

            <option>All</option>

            <option>Completed</option>

            <option>Cancelled</option>

            <option>Refunded</option>

            <option>No Show</option>

          </select>

        </div>

      </div>

            {/* Session History List */}

      <div className="space-y-4">

        {sessions.map((session) => {

          const SessionIcon = SESSION_ICONS[session.sessionType];

          return (

            <div
              key={session.id}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >

              <div className="flex items-start justify-between gap-4">

                <div className="flex gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                    {session.candidateInitials}
                  </div>

                  <div>

                    <h3 className="font-semibold">
                      {session.candidateName}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {session.candidateRole}
                    </p>

                    <p className="mt-1 text-sm font-medium text-primary">
                      {session.company}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">

                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {session.date}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {session.time}
                      </span>

                      <span className="flex items-center gap-1">
                        <SessionIcon className="h-3.5 w-3.5" />
                        {session.sessionType}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="text-right">

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLORS[session.status]}`}
                  >
                    {session.status}
                  </span>

                  <div className="mt-3 flex items-center justify-end gap-1">

                    {[...Array(session.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}

                  </div>

                  <p className="mt-3 font-bold">
                    ₹{session.amount}
                  </p>

                  <button className="mt-3 text-sm font-semibold text-primary hover:underline">
                    View Details
                  </button>

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </div>
  );
}