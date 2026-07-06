import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/auth";
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
  duration: string;
  price: number;
  type: SessionType;
  description: string;
}

interface Review {
  id: string;
  candidateName: string;
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
  experience: string;
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



const INDUSTRIES = ["All", "Technology", "E-Commerce", "Startups", "HR & Talent", "Design", "Finance", "Consulting"];
const ROLES = ["All Roles", "Product Manager", "Software Engineer", "Data Scientist", "Designer", "HR", "Founder", "Engineering Manager"];
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
  const minPrice = Math.min(...mentor.services.map((s) => s.price));
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
  const minPrice = Math.min(...mentor.services.map((s) => s.price));

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
                    <p className="font-semibold text-xs">{review.candidateName}</p>
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

function BookingModal({
  mentor, service, onClose, onConfirm,
}: {
  mentor: Mentor; service: Service; onClose: () => void; onConfirm: (booking: Omit<Booking, "id" | "status">) => void;
}) {
  const [step, setStep] = useState<"details" | "processing" | "success">("details");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [requirements, setRequirements] = useState("");
  const [selectedService, setSelectedService] = useState(service);

  const handleConfirm = () => {
    if (!date || !time) return;
    setStep("processing");
    setTimeout(() => {
      onConfirm({
        mentorId: mentor.id,
        mentorName: mentor.name,
        service: selectedService.title,
        sessionType: selectedService.type,
        date,
        time,
        amount: selectedService.price,
        requirements,
      });
      setStep("success");
    }, 1600);
  };

  const times = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"];

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
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="dash-input w-full"
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Select time</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {times.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-all ${time === t ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Requirements (optional)</p>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={3}
                  placeholder="Share specific topics, goals, or context for this session…"
                  className="dash-input w-full resize-none"
                />
              </div>

              <div className="rounded-xl border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">{selectedService.title}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedService.duration} min · {selectedService.type}</p>
                </div>
                <p className="font-bold text-primary text-lg">₹{selectedService.price.toLocaleString()}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!date || !time}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm & Pay
                </button>
              </div>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-14 px-6">
            <div className="h-9 w-9 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="font-semibold text-sm">Processing payment…</p>
            <p className="text-xs text-muted-foreground mt-1">Securing your booking in escrow</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center text-center py-10 px-6">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-base">Booking Confirmed!</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-1">
              Your session with <span className="font-semibold text-foreground">{mentor.name}</span> is booked.
            </p>
            <p className="text-xs text-muted-foreground mb-5">
              Payment of ₹{selectedService.price.toLocaleString()} is held in CareerBridge escrow and will be released after the session.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View My Bookings
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
  fetch("http://127.0.0.1:8000/api/mentors")
    .then((res) => res.json())
    .then((data) => {
      console.log("Mentors API:", data);

      setMentors(data.mentors);

      setLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setLoading(false);
    });
}, []);

useEffect(() => {
  const loadBookings = async () => {
    try {
      const data = await apiFetch<{ bookings: any[] }>("/api/bookings");

      console.log("Bookings API:", data);

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

  const toggleSave = (id: string) =>
    setSaved((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBook = (service: Service) => {
    setBookingService(service);
  };


const handleBookingConfirm = async (
  booking: Omit<Booking, "id" | "status">
) => {
  try {
    const data = await apiFetch<{ booking: any }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        mentor_id: booking.mentorId,
        service_id: bookingService?.id,
        date: booking.date,
        time: booking.time,
        requirements: booking.requirements,
        amount: bookingService?.price,
      }),
    });

    console.log("Booking Success:", data);

    setBookings((prev) => [
      {
        ...booking,
        id: data.booking.id,
        status: "Pending",
      },
      ...prev,
    ]);

    alert("Session booked successfully!");

  } catch (error: any) {
    console.error(error);
    alert(error?.message || "Booking failed");
  }
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
    const aMin = Math.min(...a.services.map((s) => s.price));
    const bMin = Math.min(...b.services.map((s) => s.price));
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
          onClose={() => { setBookingService(null); setSelectedMentor(null); }}
          onConfirm={(b) => { handleBookingConfirm(b); setBookingService(null); setSelectedMentor(null); setView("bookings"); }}
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