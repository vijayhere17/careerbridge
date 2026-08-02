import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/auth";
import { toast } from "sonner";
import {
  Search, SlidersHorizontal, Star, Bookmark, BookmarkCheck,
  MapPin, Briefcase, X, ChevronRight, ArrowLeft,
  MessageCircle, Video, Phone, Calendar, Clock,
  CheckCircle2, Send, Globe, Languages, Award,
  Filter, Users, BadgeCheck, Heart, History,
  DollarSign, Mic, FileText, ThumbsUp,
} from "lucide-react";

type SessionType = "Chat" | "Audio Call" | "Video Call";
type BookingStatus = "Pending" | "Accepted" | "Rejected" | "Completed" | "Upcoming";

interface Service {
  id: string;
  title: string;
  duration: number | string;
  price: number;
  type: SessionType;
  description: string;
}

interface Review {
  id: string;
  candidateName?: string;
  candidate?: string;
  rating: number;
  comment: string;
  date: string;
}

interface Mentor {
  id: string;
  name: string;
  initials: string;
  role: string;
  company: string;
  industry: string;
  experience: string | number;
  location: string;
  languages: string[];
  skills: string[];
  bio: string;
  rating: number;
  reviews: number;
  sessions: number;
  verified: boolean;
  available: boolean;
  services: Service[];
  testimonials: Review[];
  pricePerSession?: number;
  experienceLabel?: string;
}

interface Booking {
  id: string;
  mentorId: string;
  mentorName: string;
  service: string;
  sessionType: SessionType;
  date: string;
  time: string;
  amount: number;
  status: BookingStatus;
  requirements?: string;
}

type View = "list" | "profile" | "book" | "bookings" | "saved";



const INDUSTRIES = ["All", "Technology", "E-Commerce", "Startups", "People & Talent", "Design", "Finance", "Consulting"];
const ROLES = ["All Roles", "Product Manager", "Software Engineer", "Data Scientist", "Designer", "People Ops", "Founder", "Engineering Manager"];
const EXPERIENCES = ["Any", "1–3 yrs", "3–6 yrs", "6–10 yrs", "10+ yrs"];
const LANGUAGES = ["Any", "English", "Hindi", "Tamil", "Malayalam", "Kannada", "Marathi"];
const SORT_OPTIONS = ["Top Rated", "Most Sessions", "Price: Low to High", "Price: High to Low", "Newest"];



function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sz} ${i <= Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function SessionIcon({ type }: { type: SessionType }) {
  if (type === "Video Call") return <Video className="h-3.5 w-3.5 text-primary" />;
  if (type === "Audio Call") return <Phone className="h-3.5 w-3.5 text-primary" />;
  return <MessageCircle className="h-3.5 w-3.5 text-primary" />;
}

function Tag({ text, variant = "muted" }: { text: string; variant?: "muted" | "primary" | "success" }) {
  const styles = {
    muted: "bg-muted text-muted-foreground border border-border",
    primary: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-primary/10 text-primary border border-primary/20",
  };
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${styles[variant]}`}>{text}</span>;
}

function EmptyState({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function MentorCard({
  mentor, isSaved, onSave, onView,
}: {
  mentor: Mentor; isSaved: boolean; onSave: () => void; onView: () => void;
}) {
  const minPrice = mentor.services.length
    ? Math.min(...mentor.services.map((s) => s.price))
    : (mentor.pricePerSession ?? 0);
  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {mentor.initials}
          </div>
          {mentor.available && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-surface" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-sm">{mentor.name}</p>
                {mentor.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{mentor.role} · {mentor.company}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className="shrink-0 p-1 text-muted-foreground hover:text-primary transition-colors"
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex items-center gap-1">
              <StarRating rating={mentor.rating} />
              <span className="text-xs font-semibold">{mentor.rating}</span>
              <span className="text-xs text-muted-foreground">({mentor.reviews})</span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />{mentor.location}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {mentor.skills.slice(0, 3).map((s) => <Tag key={s} text={s} variant="primary" />)}
            {mentor.skills.length > 3 && <Tag text={`+${mentor.skills.length - 3}`} variant="muted" />}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs text-muted-foreground">From </span>
              <span className="text-sm font-bold text-primary">₹{minPrice.toLocaleString()}</span>
              <span className="text-[11px] text-muted-foreground"> / session</span>
            </div>
            <button
              onClick={onView}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MentorProfile({
  mentor, isSaved, onSave, onBook, onClose,
}: {
  mentor: Mentor; isSaved: boolean; onSave: () => void; onBook: (service: Service) => void; onClose: () => void;
}) {
  const [tab, setTab] = useState<"about" | "services" | "reviews">("about");
  const minPrice = mentor.services.length
    ? Math.min(...mentor.services.map((s) => s.price))
    : (mentor.pricePerSession ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-stretch justify-end bg-black/40" onClick={onClose}>
      <div
        className="relative flex h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-surface lg:h-full lg:w-[500px] lg:rounded-none lg:rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <span className="font-semibold text-sm truncate pr-4">{mentor.name}</span>
          <div className="flex items-center gap-1">
            <button onClick={onSave} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              {isSaved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4">
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <div className="grid h-16 w-16 place-items-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                  {mentor.initials}
                </div>
                {mentor.available && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-surface" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-base">{mentor.name}</p>
                  {mentor.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{mentor.role}</p>
                <p className="text-xs text-muted-foreground">{mentor.company} · {mentor.industry}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <StarRating rating={mentor.rating} size="lg" />
                    <span className="text-sm font-bold">{mentor.rating}</span>
                    <span className="text-xs text-muted-foreground">({mentor.reviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Experience", value: mentor.experience },
                { label: "Sessions", value: `${mentor.sessions}+` },
                { label: "Location", value: mentor.location },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted p-2">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="text-xs font-semibold mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {mentor.languages.map((l) => (
                <span key={l} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Globe className="h-3 w-3" />{l}
                </span>
              ))}
            </div>

            {!mentor.available && (
              <div className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground text-center">
                Currently unavailable for new sessions
              </div>
            )}
          </div>

          <div className="flex gap-1 rounded-xl border border-border p-1">
            {(["about", "services", "reviews"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "about" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">About</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{mentor.bio}</p>
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.skills.map((s) => <Tag key={s} text={s} variant="primary" />)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-border p-3">
                  <p className="text-[11px] text-muted-foreground">Industry</p>
                  <p className="text-xs font-semibold mt-0.5">{mentor.industry}</p>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <p className="text-[11px] text-muted-foreground">Experience</p>
                  <p className="text-xs font-semibold mt-0.5">{mentor.experience}</p>
                </div>
              </div>
            </div>
          )}

          {tab === "services" && (
            <div className="space-y-2">
              {mentor.services.map((service) => (
                <div key={service.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <SessionIcon type={service.type} />
                        <p className="font-semibold text-sm">{service.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{service.duration} min</span>
                        <span>·</span>
                        <span>{service.type}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary">₹{service.price.toLocaleString()}</p>
                      {mentor.available && (
                        <button
                          onClick={() => onBook(service)}
                          className="mt-1.5 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Book
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "reviews" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{mentor.rating}</p>
                  <StarRating rating={mentor.rating} size="lg" />
                  <p className="text-[11px] text-muted-foreground mt-0.5">{mentor.reviews} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = mentor.testimonials.filter((r) => Math.round(r.rating) === star).length;
                    const pct = mentor.testimonials.length ? (count / mentor.testimonials.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-[11px] w-4 text-right">{star}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {mentor.testimonials.map((review) => (
                <div key={review.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-semibold text-xs">{review.candidateName || review.candidate || "Candidate"}</p>
                    <span className="text-[11px] text-muted-foreground">{review.date}</span>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {mentor.available && (
          <div className="sticky bottom-0 border-t border-border bg-surface p-4">
            <button
              onClick={() => onBook(mentor.services[0])}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" /> Book a Session · From ₹{minPrice.toLocaleString()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const DEFAULT_BOOKING_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
];

const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

function weekdayFromDateInput(date: string): string {
  // date input value is always YYYY-MM-DD — parse as local noon to avoid timezone shifts
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return "";
  const parsed = new Date(year, month - 1, day, 12, 0, 0);
  return WEEKDAY_NAMES[parsed.getDay()] ?? "";
}

function normalizeSlotLabel(slot: string): string {
  const match = String(slot).trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return String(slot).trim();

  let hour = Number(match[1]);
  const minute = match[2];
  let period = (match[3] || "").toUpperCase();

  // 24h times from DB (e.g. 14:00:00)
  if (!period) {
    period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
  }

  return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
}

function BookingModal({
  mentor, service, onClose, onConfirm,
}: {
  mentor: Mentor; service: Service; onClose: () => void;
  onConfirm: (booking: Omit<Booking, "id" | "status"> & { serviceId: string }) => Promise<void>;
}) {
  const [step, setStep] = useState<"details" | "summary" | "processing" | "success" | "error">("details");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [requirements, setRequirements] = useState("");
  const [selectedService, setSelectedService] = useState(service);
  const [schedule, setSchedule] = useState<Record<string, { enabled: boolean; slots: string[] }>>({});
  const [scheduleConfigured, setScheduleConfigured] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    async function loadMeta() {
      setLoadingSlots(true);
      try {
        const [avail, wallet] = await Promise.all([
          apiFetch<{
            schedule: Record<string, { enabled: boolean; slots: string[] }>;
            configured?: boolean;
            available_days?: string[];
          }>(`/api/mentors/${mentor.id}/availability`),
          apiFetch<{ balance: number }>("/api/wallet"),
        ]);

        const nextSchedule: Record<string, { enabled: boolean; slots: string[] }> = {};
        Object.entries(avail.schedule ?? {}).forEach(([day, value]) => {
          const slots = (value?.slots ?? []).map(normalizeSlotLabel);
          nextSchedule[day] = {
            enabled: Boolean(value?.enabled && slots.length > 0),
            slots,
          };
        });

        const configured = Boolean(
          avail.configured ??
          Object.values(nextSchedule).some((day) => day.enabled && day.slots.length > 0),
        );

        setSchedule(nextSchedule);
        setScheduleConfigured(configured);
        setAvailableDays(
          avail.available_days?.length
            ? avail.available_days
            : Object.entries(nextSchedule)
                .filter(([, day]) => day.enabled && day.slots.length > 0)
                .map(([day]) => day),
        );
        setWalletBalance(wallet.balance ?? 0);
      } catch (err) {
        console.error(err);
        // If availability cannot be loaded, allow default business hours so booking is not blocked
        setSchedule({});
        setScheduleConfigured(false);
        setAvailableDays([]);
      } finally {
        setLoadingSlots(false);
      }
    }
    void loadMeta();
  }, [mentor.id]);

  useEffect(() => {
    if (!date) {
      setAvailableTimes([]);
      setTime("");
      return;
    }

    const dayName = weekdayFromDateInput(date);
    const day = schedule[dayName];

    let nextSlots: string[] = [];

    if (day?.enabled && day.slots.length > 0) {
      nextSlots = day.slots;
    } else if (!scheduleConfigured) {
      // Mentor has not published a schedule yet — offer default hours
      nextSlots = DEFAULT_BOOKING_SLOTS;
    } else {
      nextSlots = [];
    }

    // Hide past times when booking for today
    const today = new Date();
    const [year, month, dayNum] = date.split("-").map(Number);
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() + 1 === month &&
      today.getDate() === dayNum;

    if (isToday) {
      const nowMinutes = today.getHours() * 60 + today.getMinutes();
      nextSlots = nextSlots.filter((slot) => {
        const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) return true;
        let hour = Number(match[1]) % 12;
        if (match[3].toUpperCase() === "PM") hour += 12;
        const minutes = hour * 60 + Number(match[2]);
        return minutes > nowMinutes + 30;
      });
    }

    setAvailableTimes(nextSlots);
    setTime("");
  }, [date, schedule, scheduleConfigured]);

  const platformFee = Math.round(selectedService.price * 0.05);
  const total = selectedService.price + platformFee;
  const selectedWeekday = date ? weekdayFromDateInput(date) : "";

  const goToSummary = () => {
    if (!date || !time) {
      setError("Please select date and time.");
      return;
    }
    setError("");
    setStep("summary");
  };

  const handleConfirm = async () => {
    setError("");
    setStep("processing");
    try {
      await onConfirm({
        mentorId: mentor.id,
        mentorName: mentor.name,
        service: selectedService.title,
        serviceId: selectedService.id,
        sessionType: selectedService.type,
        date,
        time,
        amount: total,
        requirements,
      });
      setStep("success");
    } catch (err: any) {
      setError(err?.message || "Booking failed. Please try again.");
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 lg:items-center p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-t-2xl lg:rounded-2xl bg-surface shadow-xl max-h-[90vh] overflow-y-auto">
        {step === "details" && (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-bold text-sm">Book a Session</h3>
                <p className="text-xs text-muted-foreground">{mentor.name}</p>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Select service</p>
                <div className="space-y-2">
                  {mentor.services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedService(s)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${selectedService.id === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <SessionIcon type={s.type} />
                            <p className="font-semibold text-xs">{s.title}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{s.duration} min · {s.type}</p>
                        </div>
                        <p className="font-bold text-primary text-sm shrink-0">₹{s.price.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Select date</p>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="dash-input w-full"
                />
                {scheduleConfigured && availableDays.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Usually available: {availableDays.map((d) => d.slice(0, 3)).join(", ")}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Available time</p>
                {loadingSlots ? (
                  <p className="text-xs text-muted-foreground">Loading available slots…</p>
                ) : !date ? (
                  <p className="text-xs text-muted-foreground">Select a date to see available times.</p>
                ) : availableTimes.length === 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                    <p className="font-semibold">
                      No slots available{selectedWeekday ? ` on ${selectedWeekday}` : ""}.
                    </p>
                    <p className="mt-1">
                      {scheduleConfigured && availableDays.length > 0
                        ? `Try ${availableDays.join(", ")}.`
                        : "Try another date."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                          time === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                {!scheduleConfigured && date && availableTimes.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    Mentor has not set a custom schedule — showing standard hours.
                  </p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Requirements (optional)</p>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={3}
                  placeholder="What would you like to focus on?"
                  className="dash-input w-full resize-none"
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                onClick={goToSummary}
                disabled={!date || !time}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === "summary" && (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm">Booking Summary</h3>
              <button onClick={() => setStep("details")} className="text-xs font-semibold text-primary">Back</button>
            </div>
            <div className="p-4 space-y-3">
              {[
                ["Mentor", mentor.name],
                ["Service", selectedService.title],
                ["Date", date],
                ["Time", time],
                ["Duration", `${selectedService.duration} min`],
                ["Session fee", `₹${selectedService.price.toLocaleString()}`],
                ["Platform fee (5%)", `₹${platformFee.toLocaleString()}`],
                ["Total payable", `₹${total.toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
              <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                Total payable is deducted from your wallet and held in escrow until the session is completed.
                {walletBalance !== null && (
                  <p className="mt-1 font-semibold text-foreground">Wallet balance: ₹{walletBalance.toLocaleString()}</p>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cancellation is free before mentor acceptance. After confirmation, refunds follow CareerBridge policy.
              </p>
              <button
                onClick={() => void handleConfirm()}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Pay & Confirm Booking
              </button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="p-10 text-center space-y-3">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="font-semibold text-sm">Processing payment…</p>
            <p className="text-xs text-muted-foreground">Securing your booking</p>
          </div>
        )}

        {step === "error" && (
          <div className="p-6 space-y-3 text-center">
            <p className="font-semibold text-sm text-red-600">Payment failed</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <button
              onClick={() => setStep("summary")}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold"
            >
              Try again
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="p-6 space-y-3 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h3 className="font-bold text-lg">Booking Confirmed</h3>
            <p className="text-sm text-muted-foreground">
              Your request was sent to {mentor.name}. You'll be notified when they accept.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Go to My Bookings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MyBookings({ bookings }: { bookings: Booking[] }) {
  const statusColors: Record<BookingStatus, string> = {
    Pending: "bg-muted text-muted-foreground",
    Accepted: "bg-primary/10 text-primary",
    Upcoming: "bg-primary/10 text-primary",
    Completed: "bg-muted text-foreground",
    Rejected: "bg-muted text-muted-foreground",
  };

  const sessionIcons: Record<SessionType, React.ElementType> = {
    Chat: MessageCircle,
    "Audio Call": Phone,
    "Video Call": Video,
  };

  if (!bookings.length) return <EmptyState icon={Calendar} title="No bookings yet" body="Book a session with a mentor to get started." />;

  return (
    <div className="space-y-2">
      {bookings.map((b) => {
        const Icon = sessionIcons[b.sessionType];
        return (
          <div key={b.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm">{b.service}</p>
                <p className="text-xs text-muted-foreground">with {b.mentorName}</p>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ${statusColors[b.status]}`}>
                {b.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{b.date}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.time}</span>
              <span className="flex items-center gap-1"><Icon className="h-3 w-3" />{b.sessionType}</span>
              <span className="font-semibold text-primary">₹{b.amount.toLocaleString()}</span>
            </div>
            {b.status === "Pending" && (
              <p className="mt-2 text-[11px] text-muted-foreground">Waiting for mentor to accept your request</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FiltersDrawer({ onClose, onApply }: { onClose: () => void; onApply: (f: FilterState) => void; }) {
  const [industry, setIndustry] = useState("All");
  const [role, setRole] = useState("All Roles");
  const [experience, setExperience] = useState("Any");
  const [language, setLanguage] = useState("Any");
  const [sort, setSort] = useState("Top Rated");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">Filter Mentors</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Industry</p>
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRIES.map((i) => <Chip key={i} label={i} active={industry === i} onClick={() => setIndustry(i)} />)}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Experience</p>
            <div className="flex flex-wrap gap-1.5">
              {EXPERIENCES.map((e) => <Chip key={e} label={e} active={experience === e} onClick={() => setExperience(e)} />)}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Language</p>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((l) => <Chip key={l} label={l} active={language === l} onClick={() => setLanguage(l)} />)}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sort by</p>
            <div className="flex flex-wrap gap-1.5">
              {SORT_OPTIONS.map((s) => <Chip key={s} label={s} active={sort === s} onClick={() => setSort(s)} />)}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setAvailableOnly(!availableOnly)}
                className={`h-5 w-9 rounded-full transition-colors cursor-pointer ${availableOnly ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`h-4 w-4 m-0.5 rounded-full bg-white shadow transition-transform ${availableOnly ? "translate-x-4" : "translate-x-0"}`} />
              </div>
              <span className="text-sm">Available mentors only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`h-5 w-9 rounded-full transition-colors cursor-pointer ${verifiedOnly ? "bg-primary" : "bg-muted"}`}
              >
                <div className={`h-4 w-4 m-0.5 rounded-full bg-white shadow transition-transform ${verifiedOnly ? "translate-x-4" : "translate-x-0"}`} />
              </div>
              <span className="text-sm">Verified mentors only</span>
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
            Reset
          </button>
          <button
            onClick={() => { onApply({ industry, role, experience, language, sort, availableOnly, verifiedOnly }); onClose(); }}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

interface FilterState {
  industry: string;
  role: string;
  experience: string;
  language: string;
  sort: string;
  availableOnly: boolean;
  verifiedOnly: boolean;
}


 export function FindMentors() {

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    industry: "All", role: "All Roles", experience: "Any",
    language: "Any", sort: "Top Rated", availableOnly: false, verifiedOnly: false,
  });
const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    async function loadMentors() {
      try {
        const data = await apiFetch<{ mentors: any[] }>("/api/mentors");
        const normalized = (data.mentors ?? []).map((m) => ({
          ...m,
          id: String(m.id),
          experience: m.experienceLabel ?? (m.experience ? `${m.experience}+ yrs` : "—"),
          languages: m.languages ?? [],
          skills: m.skills ?? [],
          services: (m.services ?? []).map((s: any) => ({
            id: String(s.id),
            title: s.title,
            duration: typeof s.duration === "string"
              ? Number.parseInt(s.duration, 10) || 30
              : Number(s.duration ?? 30),
            price: Number(s.price ?? 0),
            type: (s.type || "Video Call") as SessionType,
            description: s.description ?? "",
          })),
          testimonials: (m.testimonials ?? []).map((t: any) => ({
            id: String(t.id),
            candidateName: t.candidateName || t.candidate || "Candidate",
            rating: Number(t.rating ?? 0),
            comment: t.comment ?? "",
            date: t.date || t.submittedDate || "",
          })),
          reviews: Number(m.reviews ?? 0),
          sessions: Number(m.sessions ?? 0),
          rating: Number(m.rating ?? 0),
          pricePerSession: Number(m.pricePerSession ?? 0),
        })) as Mentor[];
        setMentors(normalized);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void loadMentors();
  }, []);

  useEffect(() => {
    async function loadSaved() {
      try {
        const data = await apiFetch<{ mentors: { id: string | number }[] }>("/api/mentors/saved");
        setSaved(new Set((data.mentors ?? []).map((m) => String(m.id))));
      } catch (err) {
        console.error(err);
      }
    }
    void loadSaved();
  }, []);

useEffect(() => {
  const loadBookings = async () => {
    try {
      const data = await apiFetch<{ bookings: any[] }>("/api/bookings");

      setBookings(
  data.bookings.map((b) => ({
    id: String(b.id),
    mentorId: String(b.mentorId),
    mentorName: b.mentorName,
    service: b.service,
    sessionType: b.sessionType as SessionType,
    date: b.date,
    time: b.time,
    amount: Number(b.amount),
    status: b.status as BookingStatus,
    requirements: b.requirements,
  }))
);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    }
  };

  loadBookings();
}, []);

  const toggleSave = async (id: string) => {
    const isSaved = saved.has(id);
    setSaved((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      if (isSaved) {
        await apiFetch(`/api/mentors/save/${id}`, { method: "DELETE" });
      } else {
        await apiFetch("/api/mentors/save", {
          method: "POST",
          body: JSON.stringify({ mentor_id: Number(id) }),
        });
      }
    } catch (err) {
      console.error(err);
      setSaved((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const handleBook = (service: Service) => {
    setBookingService(service);
  };


const handleBookingConfirm = async (
  booking: Omit<Booking, "id" | "status"> & { serviceId: string }
) => {
  const data = await apiFetch<{ booking: any }>("/api/bookings", {
    method: "POST",
    body: JSON.stringify({
      mentor_id: Number(booking.mentorId),
      service_id: Number(booking.serviceId || bookingService?.id),
      date: booking.date,
      time: booking.time,
      requirements: booking.requirements,
      amount: booking.amount,
    }),
  });

  setBookings((prev) => [
    {
      ...booking,
      id: String(data.booking.id),
      status: (data.booking.status as BookingStatus) || "Pending",
    },
    ...prev,
  ]);

  toast.success("Booking created. Mentor has been notified.");
};

const filteredMentors = mentors.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.company.toLowerCase().includes(q) || m.skills.some((s) => s.toLowerCase().includes(q)) || m.industry.toLowerCase().includes(q);
    const matchIndustry = filters.industry === "All" || m.industry === filters.industry;
    const matchAvailable = !filters.availableOnly || m.available;
    const matchVerified = !filters.verifiedOnly || m.verified;
    const matchLanguage = filters.language === "Any" || m.languages.includes(filters.language);
    return matchSearch && matchIndustry && matchAvailable && matchVerified && matchLanguage;
  }).sort((a, b) => {
    if (filters.sort === "Top Rated") return b.rating - a.rating;
    if (filters.sort === "Most Sessions") return b.sessions - a.sessions;
    const aMin = a.services.length ? Math.min(...a.services.map((s) => s.price)) : Number.POSITIVE_INFINITY;
    const bMin = b.services.length ? Math.min(...b.services.map((s) => s.price)) : Number.POSITIVE_INFINITY;
    if (filters.sort === "Price: Low to High") return aMin - bMin;
    if (filters.sort === "Price: High to Low") return bMin - aMin;
    return 0;
  });

  const savedMentors = mentors.filter((m) => saved.has(m.id));

if (loading) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-gray-500">Loading mentors...</p>
    </div>
  );
}

  const TABS = [
    { id: "list" as View, label: "Browse", icon: Search },
    { id: "bookings" as View, label: "Bookings", icon: Calendar },
    { id: "saved" as View, label: "Saved", icon: Bookmark },
  ];

  const viewTitles: Record<View, string> = {
    list: "Find Mentors",
    profile: "Mentor Profile",
    book: "Book Session",
    bookings: "My Bookings",
    saved: "Saved Mentors",
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="font-semibold text-sm">{viewTitles[view]}</h2>
              {view === "list" && (
                <p className="text-[11px] text-muted-foreground">{filteredMentors.length} mentors available</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setView(tab.id)}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${view === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {view === "list" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, role, skill, company…"
                className="dash-input w-full pl-9"
              />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Filters</span>
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => setFilters((f) => ({ ...f, industry: ind }))}
                className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${filters.industry === ind ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
              >
                {ind}
              </button>
            ))}
          </div>

          {filteredMentors.length === 0
            ? <EmptyState icon={Users} title="No mentors found" body="Try adjusting your search or filters." />
            : (
              <div className="space-y-2">
                {filteredMentors.map((mentor) => (
                  <MentorCard
                    key={mentor.id}
                    mentor={mentor}
                    isSaved={saved.has(mentor.id)}
                    onSave={() => toggleSave(mentor.id)}
                    onView={() => setSelectedMentor(mentor)}
                  />
                ))}
              </div>
            )}
        </div>
      )}

      {view === "bookings" && <MyBookings bookings={bookings} />}

      {view === "saved" && (
        <div className="space-y-2">
          {savedMentors.length === 0
            ? <EmptyState icon={Heart} title="No saved mentors" body="Bookmark mentors to save them here." />
            : savedMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                isSaved
                onSave={() => toggleSave(mentor.id)}
                onView={() => setSelectedMentor(mentor)}
              />
            ))}
        </div>
      )}

      {selectedMentor && (
        <MentorProfile
          mentor={selectedMentor}
          isSaved={saved.has(selectedMentor.id)}
          onSave={() => toggleSave(selectedMentor.id)}
          onBook={(service) => handleBook(service)}
          onClose={() => setSelectedMentor(null)}
        />
      )}

      {bookingService && selectedMentor && (
        <BookingModal
          mentor={selectedMentor}
          service={bookingService}
          onClose={() => { setBookingService(null); setSelectedMentor(null); setView("bookings"); }}
          onConfirm={handleBookingConfirm}
        />
      )}

      {showFilters && (
        <FiltersDrawer
          onClose={() => setShowFilters(false)}
          onApply={(f) => setFilters(f)}
        />
      )}
    </div>
  );
}