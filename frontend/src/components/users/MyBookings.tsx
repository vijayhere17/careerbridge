import { useState } from "react";
import {
  Calendar, Clock, Video, Phone, MessageCircle,
  CheckCircle2, XCircle, AlertCircle, ChevronRight,
  Star, X, Send, Filter,
} from "lucide-react";
import { useEffect } from "react";
import { apiFetch } from "@/lib/auth";

type SessionType = "Chat" | "Audio Call" | "Video Call";
type BookingStatus =
  | "Pending"
  | "Accepted"
  | "Upcoming"
  | "Completed"
  | "Rejected"
  | "Cancelled";

interface Booking {
  id: string;
  mentorName: string;
  mentorInitials: string;
  service: string;
  sessionType: SessionType;
  date: string;
  time: string;
  duration: number;
  amount: number;
  status: BookingStatus;
  requirements?: string;
  meetLink?: string;
  reviewed?: boolean;
}



const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
  Pending:   { label: "Pending",   color: "bg-amber-50 text-amber-700 border border-amber-200",  icon: AlertCircle },
  Accepted:  { label: "Accepted",  color: "bg-primary/10 text-primary border border-primary/20", icon: CheckCircle2 },
  Upcoming:  { label: "Upcoming",  color: "bg-primary/10 text-primary border border-primary/20", icon: Clock },
  Completed: { label: "Completed", color: "bg-muted text-muted-foreground border border-border",  icon: CheckCircle2 },
  Rejected:  { label: "Rejected",  color: "bg-red-50 text-red-600 border border-red-200",         icon: XCircle },
  Cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground border border-border",  icon: XCircle },
};

const SESSION_ICONS: Record<SessionType, React.ElementType> = {
  Chat: MessageCircle,
  "Audio Call": Phone,
  "Video Call": Video,
};

const TABS: { id: BookingStatus | "all"; label: string }[] = [
  { id: "all",       label: "All" },
  { id: "Upcoming",  label: "Upcoming" },
  { id: "Pending",   label: "Pending" },
  { id: "Completed", label: "Completed" },
  { id: "Cancelled", label: "Cancelled" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function ReviewModal({ booking, onClose, onSubmit }: {
  booking: Booking;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 lg:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">Rate your session</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center mb-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 mx-auto mb-2">
            <span className="text-base font-bold text-primary">{booking.mentorInitials}</span>
          </div>
          <p className="font-semibold text-sm">{booking.mentorName}</p>
          <p className="text-xs text-muted-foreground">{booking.service}</p>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(i)}
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  i <= (hovered || rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience with this mentor…"
          className="dash-input w-full resize-none mb-4"
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={() => rating > 0 && onSubmit(rating, comment)}
            disabled={rating === 0}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" /> Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onReview, onCancel }: {
  booking: Booking;
  onReview: (b: Booking) => void;
  onCancel: (id: string) => void;
}) {
  const status = STATUS_CONFIG[booking.status];
  const StatusIcon = status.icon;
  const SessionIcon = SESSION_ICONS[booking.sessionType];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {booking.mentorInitials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{booking.service}</p>
              <p className="text-xs text-muted-foreground">with {booking.mentorName}</p>
            </div>
            <span className={`shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${status.color}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> {formatDate(booking.date)}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {booking.time}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <SessionIcon className="h-3 w-3" /> {booking.sessionType}
            </span>
            <span className="text-xs font-semibold text-primary">₹{booking.amount.toLocaleString()}</span>
          </div>

          {booking.requirements && (
            <p className="mt-2 text-[11px] text-muted-foreground line-clamp-1">
              Note: {booking.requirements}
            </p>
          )}

          {booking.status === "Upcoming" && (
            <div className="mt-3 flex gap-2">
              {booking.meetLink && (
                <a
                  href={booking.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Video className="h-3.5 w-3.5" /> Join Session
                </a>
              )}
              <button
                onClick={() => onCancel(booking.id)}
                className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {booking.status === "Pending" && (
            <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <p className="text-[11px] text-amber-700">Waiting for mentor to accept your request</p>
            </div>
          )}

          {booking.status === "Rejected" && (
            <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
              <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <p className="text-[11px] text-red-600">Mentor declined. Your payment will be refunded.</p>
            </div>
          )}

          {booking.status === "Completed" && !booking.reviewed && (
            <button
              onClick={() => onReview(booking)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              <Star className="h-3.5 w-3.5" /> Rate this session
            </button>
          )}

          {booking.status === "Completed" && booking.reviewed && (
            <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-[11px] text-muted-foreground">You've reviewed this session</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<BookingStatus | "all">("all");
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

  const filtered = activeTab === "all"
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

  const counts: Record<string, number> = {
    all: bookings.length,
    Upcoming: bookings.filter((b) => b.status === "Upcoming").length,
    Pending: bookings.filter((b) => b.status === "Pending").length,
    Completed: bookings.filter((b) => b.status === "Completed").length,
  };

  const handleCancel = async (id: string) => {
  try {
    await apiFetch(`/api/bookings/${id}/cancel`, {
      method: "PATCH",
    });

    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: "Cancelled" as BookingStatus }
          : b
      )
    );
  } catch (err) {
    console.error(err);
  }
};


  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!reviewTarget) return;
    try {
      await apiFetch(`/api/bookings/${reviewTarget.id}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === reviewTarget.id ? { ...b, reviewed: true } : b,
        ),
      );
      setReviewTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  const stats = [
    { label: "Total Booked", value: bookings.length },
    { label: "Upcoming", value: bookings.filter((b) => b.status === "Upcoming").length },
    { label: "Completed", value: bookings.filter((b) => b.status === "Completed").length },
    { label: "Total Spent", value: `₹${bookings.filter((b) => ["Completed", "Upcoming", "Pending"].includes(b.status)).reduce((s, b) => s + b.amount, 0).toLocaleString()}` },
  ];

  useEffect(() => {
  const loadBookings = async () => {
    try {
      const data = await apiFetch<{ bookings: any[] }>("/api/bookings");

      setBookings(
        data.bookings.map((b) => ({
          id: String(b.id),
          mentorName: b.mentorName,
          mentorInitials: b.mentorInitials || (b.mentorName || "M")
            .split(" ")
            .map((x: string) => x[0])
            .join("")
            .substring(0, 2)
            .toUpperCase(),
          service: b.service,
          sessionType: (b.sessionType || "Video Call") as SessionType,
          date: b.date,
          time: b.time,
          duration: Number(b.duration ?? 60),
          amount: Number(b.amount),
          status: b.status as BookingStatus,
          requirements: b.requirements,
          meetLink: b.meetLink,
          reviewed: Boolean(b.reviewed),
        }))
      );
    } catch (error) {
      console.error(error);
    }
  };

  loadBookings();
}, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

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
            {counts[tab.id] > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.id ? "bg-white/20" : "bg-muted"}`}>
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted mb-3">
            <Calendar className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No bookings here</p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTab === "all" ? "You haven't booked any sessions yet." : `No ${activeTab.toLowerCase()} bookings.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onReview={setReviewTarget}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {reviewTarget && (
        <ReviewModal
          booking={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}