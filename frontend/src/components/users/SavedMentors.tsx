import { useState } from "react";
import {
  BookmarkCheck, MapPin, Star, Search, Trash2,
  BadgeCheck, Video, Phone, MessageCircle, X,
  Users, Calendar, Clock, ChevronRight,
} from "lucide-react";

interface Mentor {
  id: string;
  name: string;
  initials: string;
  role: string;
  company: string;
  industry: string;
  location: string;
  rating: number;
  reviewCount: number;
  sessionCount: number;
  verified: boolean;
  available: boolean;
  skills: string[];
  minPrice: number;
  savedDate: string;
  sessionTypes: ("Chat" | "Audio Call" | "Video Call")[];
}

const SAVED_MENTORS: Mentor[] = [
  {
    id: "m1", name: "Priya Sharma", initials: "PS",
    role: "Senior Product Manager", company: "Google",
    industry: "Technology", location: "Bengaluru",
    rating: 4.9, reviewCount: 124, sessionCount: 340,
    verified: true, available: true,
    skills: ["Product Strategy", "PM Interviews", "Roadmapping", "OKRs"],
    minPrice: 299, savedDate: "2025-07-10",
    sessionTypes: ["Video Call", "Audio Call", "Chat"],
  },
  {
    id: "m2", name: "Rahul Verma", initials: "RV",
    role: "Engineering Manager", company: "Microsoft",
    industry: "Technology", location: "Hyderabad",
    rating: 4.8, reviewCount: 98, sessionCount: 280,
    verified: true, available: true,
    skills: ["System Design", "DSA", "FAANG Prep", "Leadership"],
    minPrice: 999, savedDate: "2025-07-08",
    sessionTypes: ["Video Call", "Audio Call"],
  },
  {
    id: "m3", name: "Anjali Menon", initials: "AM",
    role: "Data Science Lead", company: "Flipkart",
    industry: "E-Commerce", location: "Bengaluru",
    rating: 4.7, reviewCount: 76, sessionCount: 195,
    verified: true, available: false,
    skills: ["Machine Learning", "Python", "SQL", "NLP"],
    minPrice: 599, savedDate: "2025-07-05",
    sessionTypes: ["Video Call", "Chat"],
  },
  {
    id: "m4", name: "Meera Pillai", initials: "MP",
    role: "People Ops Director", company: "Infosys",
    industry: "People & Talent", location: "Chennai",
    rating: 4.8, reviewCount: 203, sessionCount: 520,
    verified: true, available: true,
    skills: ["Resume Building", "Interview Skills", "Salary Negotiation", "LinkedIn"],
    minPrice: 399, savedDate: "2025-07-01",
    sessionTypes: ["Video Call", "Audio Call", "Chat"],
  },
  {
    id: "m5", name: "Siddharth Joshi", initials: "SJ",
    role: "Startup Founder & CTO", company: "TechVentures",
    industry: "Startups", location: "Mumbai",
    rating: 4.9, reviewCount: 52, sessionCount: 140,
    verified: true, available: true,
    skills: ["Entrepreneurship", "Fundraising", "CTO Mentorship", "Go-to-Market"],
    minPrice: 1799, savedDate: "2025-06-28",
    sessionTypes: ["Video Call"],
  },
];

const SESSION_ICONS = {
  "Chat": MessageCircle,
  "Audio Call": Phone,
  "Video Call": Video,
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3 w-3 ${i <= Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/20"}`} />
      ))}
    </div>
  );
}

function RemoveDialog({ mentor, onConfirm, onCancel }: {
  mentor: Mentor;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 lg:items-center">
      <div className="w-full max-w-xs rounded-2xl bg-surface p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-sm">Remove from saved?</p>
            <p className="text-xs text-muted-foreground">{mentor.name}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          You can always save them again from the Find Mentors page.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function MentorCard({ mentor, onRemove, onBook }: {
  mentor: Mentor;
  onRemove: (m: Mentor) => void;
  onBook: (m: Mentor) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/30 hover:shadow-sm">
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
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-sm truncate">{mentor.name}</p>
                {mentor.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">{mentor.role} · {mentor.company}</p>
            </div>
            <button
              onClick={() => onRemove(mentor)}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Remove from saved"
            >
              <BookmarkCheck className="h-4 w-4 text-primary" />
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="flex items-center gap-1">
              <Stars rating={mentor.rating} />
              <span className="text-xs font-semibold">{mentor.rating}</span>
              <span className="text-xs text-muted-foreground">({mentor.reviewCount})</span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />{mentor.location}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {mentor.skills.slice(0, 3).map((s) => (
              <span key={s} className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-medium text-primary">
                {s}
              </span>
            ))}
            {mentor.skills.length > 3 && (
              <span className="rounded-md bg-muted border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                +{mentor.skills.length - 3}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              {mentor.sessionTypes.map((t) => {
                const Icon = SESSION_ICONS[t];
                return <Icon key={t} className="h-3.5 w-3.5 text-muted-foreground" />;
              })}
              <span className="text-xs text-muted-foreground ml-0.5">available</span>
            </div>
            <span className="text-xs text-muted-foreground">
              From <span className="font-bold text-primary">₹{mentor.minPrice.toLocaleString()}</span>
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            {mentor.available ? (
              <button
                onClick={() => onBook(mentor)}
                className="flex-1 rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
              >
                <Calendar className="h-3.5 w-3.5" /> Book Session
              </button>
            ) : (
              <div className="flex-1 rounded-lg bg-muted py-2 text-xs font-semibold text-muted-foreground text-center">
                Currently unavailable
              </div>
            )}
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">
            Saved on {new Date(mentor.savedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SavedMentors({ onFindMentors }: { onFindMentors?: () => void }) {
  const [mentors, setMentors] = useState<Mentor[]>(SAVED_MENTORS);
  const [search, setSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Mentor | null>(null);
  const [bookTarget, setBookTarget] = useState<Mentor | null>(null);

  const filtered = mentors.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.company.toLowerCase().includes(q) || m.skills.some((s) => s.toLowerCase().includes(q));
  });

  const handleRemove = (mentor: Mentor) => setRemoveTarget(mentor);

  const confirmRemove = () => {
    if (!removeTarget) return;
    setMentors((prev) => prev.filter((m) => m.id !== removeTarget.id));
    setRemoveTarget(null);
  };

  const stats = [
    { label: "Saved",       value: mentors.length },
    { label: "Available",   value: mentors.filter((m) => m.available).length },
    { label: "Avg Rating",  value: mentors.length ? (mentors.reduce((s, m) => s + m.rating, 0) / mentors.length).toFixed(1) : "—" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {mentors.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved mentors…"
            className="dash-input w-full pl-9"
          />
        </div>
      )}

      {filtered.length === 0 && mentors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No saved mentors yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">
            Save mentors while browsing and they'll appear here for quick access.
          </p>
          {onFindMentors && (
            <button
              onClick={onFindMentors}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Find Mentors <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted mb-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No results found</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              onRemove={handleRemove}
              onBook={setBookTarget}
            />
          ))}
        </div>
      )}

      {removeTarget && (
        <RemoveDialog
          mentor={removeTarget}
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}

      {bookTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 lg:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm">Book a Session</h3>
              <button onClick={() => setBookTarget(null)} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3 mb-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                {bookTarget.initials}
              </div>
              <div>
                <p className="font-semibold text-sm">{bookTarget.name}</p>
                <p className="text-xs text-muted-foreground">{bookTarget.role}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              To book a session, go to the Find Mentors page to view {bookTarget.name}'s full profile and available services.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setBookTarget(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                Cancel
              </button>
              {onFindMentors && (
                <button
                  onClick={() => { setBookTarget(null); onFindMentors(); }}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  View Profile
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}