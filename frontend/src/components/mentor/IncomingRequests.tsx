import { useEffect, useState } from "react";
import {
  Video, Phone, MessageCircle, Clock, Calendar,
  CheckCircle2, XCircle, User, ChevronRight, X,
  AlertCircle, DollarSign,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

type SessionType = "Video Call" | "Audio Call" | "Chat";
type RequestStatus = "pending" | "accepted" | "rejected";

interface Request {
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
  status: RequestStatus;
  requirements?: string;
  requestedAt: string;
}

const MOCK_REQUESTS: Request[] = [
  {
    id: "r1",
    candidateName: "Rohan Mehta",
    candidateInitials: "RM",
    candidateRole: "Software Engineer, 3 yrs",
    service: "PM Mock Interview",
    sessionType: "Video Call",
    date: "2025-07-22",
    time: "11:00 AM",
    duration: 60,
    amount: 1499,
    status: "pending",
    requirements: "I want to practice product sense and estimation questions for Google PM role. Please focus on structured frameworks.",
    requestedAt: "2 hours ago",
  },
  {
    id: "r2",
    candidateName: "Sneha Kapoor",
    candidateInitials: "SK",
    candidateRole: "MBA Student",
    service: "Career Guidance Session",
    sessionType: "Audio Call",
    date: "2025-07-23",
    time: "04:00 PM",
    duration: 30,
    amount: 699,
    status: "pending",
    requirements: "Transitioning from MBA to product management. Need advice on breaking in without prior PM experience.",
    requestedAt: "5 hours ago",
  },
  {
    id: "r3",
    candidateName: "Arjun Patel",
    candidateInitials: "AP",
    candidateRole: "Product Manager, 2 yrs",
    service: "Resume & Portfolio Review",
    sessionType: "Video Call",
    date: "2025-07-24",
    time: "10:00 AM",
    duration: 45,
    amount: 999,
    status: "pending",
    requirements: "Applying to senior PM roles at Series B startups. Please review my resume and case study portfolio.",
    requestedAt: "1 day ago",
  },
  {
    id: "r4",
    candidateName: "Prachi Shah",
    candidateInitials: "PS",
    candidateRole: "Business Analyst, 4 yrs",
    service: "Quick Chat",
    sessionType: "Chat",
    date: "2025-07-20",
    time: "02:00 PM",
    duration: 15,
    amount: 299,
    status: "accepted",
    requestedAt: "2 days ago",
  },
  {
    id: "r5",
    candidateName: "Karan Singh",
    candidateInitials: "KS",
    candidateRole: "Engineer, 1 yr",
    service: "Career Guidance Session",
    sessionType: "Audio Call",
    date: "2025-07-18",
    time: "06:00 PM",
    duration: 30,
    amount: 699,
    status: "rejected",
    requestedAt: "3 days ago",
  },
];

const SESSION_ICONS: Record<string, React.ElementType> = {
  "Video Call": Video,
  "video": Video,
  "Audio Call": Phone,
  "audio": Phone,
  "Chat": MessageCircle,
  "chat": MessageCircle,
};

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: "Pending",  color: "bg-amber-50 text-amber-700 border-amber-200",  icon: AlertCircle },
  accepted: { label: "Accepted", color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-600 border-red-200",        icon: XCircle },
};

const TABS: { id: RequestStatus | "all"; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "pending",  label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function DetailDrawer({ request, onClose, onAccept, onReject }: {
  request: Request;
  onClose: () => void;
  onAccept: (id: string) => Promise<void>;
onReject: (id: string) => Promise<void>;
}) {
  const Icon = SESSION_ICONS[request.sessionType] ?? Video;
  const status = STATUS_CONFIG[request.status];
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 lg:items-stretch" onClick={onClose}>
      <div
        className="relative flex h-[90vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-surface lg:h-full lg:w-[420px] lg:rounded-none lg:rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <span className="font-semibold text-sm">Booking Request</span>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-border p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-base font-bold text-primary">
              {request.candidateInitials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm">{request.candidateName}</p>
              <p className="text-xs text-muted-foreground">{request.candidateRole}</p>
              <span className={`mt-1 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.color}`}>
                <StatusIcon className="h-3 w-3" /> {status.label}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Session Details</p>
            {[
              { icon: Icon,       label: "Service",  value: request.service },
              { icon: Icon,       label: "Type",     value: request.sessionType },
              { icon: Calendar,   label: "Date",     value: formatDate(request.date) },
              { icon: Clock,      label: "Time",     value: `${request.time} · ${request.duration} min` },
              { icon: DollarSign, label: "Amount",   value: `₹${request.amount.toLocaleString()} (held in escrow)` },
            ].map(({ icon: I, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted">
                  <I className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {request.requirements && (
            <div className="rounded-xl border border-border p-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Requirements from candidate</p>
              <p className="text-sm text-muted-foreground leading-relaxed">"{request.requirements}"</p>
            </div>
          )}

          <div className="rounded-xl bg-muted p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Payment of ₹{request.amount.toLocaleString()} is held in CareerBridge escrow and released to your wallet after the session is completed.
            </p>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="sticky bottom-0 border-t border-border bg-surface p-4 flex gap-2">
            <button
              onClick={() => onReject(request.id)}
              className="flex-1 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="h-4 w-4" /> Decline
            </button>
            <button
              onClick={() => onAccept(request.id)}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" /> Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ request, onView, onAccept, onReject }: {
  request: Request;
  onView: () => void;
  onAccept: (id: string) => Promise<void>;
onReject: (id: string) => Promise<void>;
}) {
  const Icon = SESSION_ICONS[request.sessionType] ?? Video;
  const status = STATUS_CONFIG[request.status];
  const StatusIcon = status.icon;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/30">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {request.candidateInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{request.candidateName}</p>
              <p className="text-xs text-muted-foreground truncate">{request.candidateRole}</p>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.color}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>

          <p className="text-xs font-medium mt-1.5">{request.service}</p>

          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Icon className="h-3 w-3" /> {request.sessionType}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" /> {formatDate(request.date)} · {request.time}
            </span>
            <span className="text-[11px] font-bold text-primary">₹{request.amount.toLocaleString()}</span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
  <span className="text-[11px] text-muted-foreground">
    {request.requestedAt}
  </span>

  <button
    type="button"
    onClick={onView}
    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
  >
    {request.status === "pending"
      ? "View Request Details"
      : "View Details"}

    <ChevronRight className="h-4 w-4" />
  </button>
</div>
        </div>
      </div>
    </div>
  );
}

export function MentorIncomingRequests() {
 const [requests, setRequests] = useState<Request[]>([]);
const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RequestStatus | "all">("all");
  const [selected, setSelected] = useState<Request | null>(null);

  useEffect(() => {
  async function loadRequests() {
    try {
      const data = await apiFetch<{
        requests: Request[];
      }>("/api/mentor/incoming-requests");

      setRequests(data.requests);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  loadRequests();
}, []);

const handleAccept = async (id: string) => {
  try {
    await apiFetch(
      `/api/mentor/incoming-requests/${id}/accept`,
      {
        method: "POST",
      }
    );

    setRequests((prev) =>
      prev.filter((request) => request.id !== id)
    );

    setSelected(null);
  } catch (error) {
    console.error("Accept booking error:", error);
  }
};

const handleReject = async (id: string) => {
  try {
    await apiFetch(
      `/api/mentor/incoming-requests/${id}/reject`,
      {
        method: "POST",
      }
    );

    setRequests((prev) =>
      prev.filter((request) => request.id !== id)
    );

    setSelected(null);
  } catch (error) {
    console.error("Reject booking error:", error);
  }
};

  const filtered = activeTab === "all" ? requests : requests.filter((r) => r.status === activeTab);

  const counts = {
    all:      requests.length,
    pending:  requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending",  value: counts.pending },
          { label: "Accepted", value: counts.accepted },
          { label: "Rejected", value: counts.rejected },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {counts.pending > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            {counts.pending} request{counts.pending > 1 ? "s" : ""} waiting for your response
          </p>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/40"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.id ? "bg-white/20" : "bg-muted"}`}>
              {counts[tab.id]}
            </span>
          </button>
        ))}
      </div>

     {loading ? (
    <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
            Loading requests...
        </p>
    </div>
) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted mb-3">
            <User className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No requests here</p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTab === "all" ? "You have no booking requests yet." : `No ${activeTab} requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onView={() => setSelected(request)}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {selected && (
        <DetailDrawer
          request={selected}
          onClose={() => setSelected(null)}
          onAccept={handleAccept}
onReject={handleReject}
        />
      )}
    </div>
  );
}