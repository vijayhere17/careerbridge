import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  Star,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Users,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/auth";

type MentorService = {
  id: number;
  title: string;
  description: string | null;
  price: number;
  duration: number;
  sessionType: string;
  status: string;
};

type MentorAvailability = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type MentorReview = {
  id: number;
  userName: string;
  rating: number;
  comment: string | null;
  submittedAt: string | null;
};

type MentorData = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  company: string;
  designation: string;
  industry: string;
  experience: number;
  location: string | null;
  bio: string | null;
  rating: number;
  reviewCount: number;
  sessionCount: number;
  verified: boolean;
  available: boolean;
  profilePhoto: string | null;
  skills: string[];
  languages: string[];
  services: MentorService[];
  availability: MentorAvailability[];
  reviews: MentorReview[];
  stats: {
    sessionsConducted: number;
    reviewCount: number;
    averageRating: number;
  };
};

type MentorProfileResponse = {
  mentor: MentorData;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* ────────────────────────────────────────────────────────────
   Small building blocks
   ──────────────────────────────────────────────────────────── */

function StarRating({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export function MentorProfile() {
  const [mentor, setMentor] = useState<MentorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await apiFetch<MentorProfileResponse>("/api/mentor/profile");
        setMentor(response.mentor);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load mentor profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Loading mentor profile…</div>;
  }

  if (error || !mentor) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <p className="text-sm text-destructive">{error || "Mentor profile not found."}</p>
      </div>
    );
  }

  const initials = mentor.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="h-28 sm:h-32 gradient-primary" />

        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {mentor.profilePhoto ? (
                <img
                  src={mentor.profilePhoto}
                  alt={mentor.name}
                  className="h-24 w-24 rounded-2xl border-4 border-surface object-cover sm:h-28 sm:w-28"
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-2xl border-4 border-surface bg-primary text-2xl font-bold text-primary-foreground sm:h-28 sm:w-28">
                  {initials}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold sm:text-2xl">{mentor.name}</h1>
                  {mentor.verified && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">{mentor.designation}</p>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> {mentor.company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BriefcaseBusiness className="h-3.5 w-3.5" /> {mentor.experience} yrs experience
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <StarRating value={mentor.rating} />
                  <span className="text-sm font-semibold">{mentor.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({mentor.reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="brand" size="lg">Edit Profile</Button>
              <button
                type="button"
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
              >
                Manage Services
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About & details */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="About">
            <p className="text-sm leading-7 text-muted-foreground">
              {mentor.bio || "No professional bio added yet."}
            </p>
          </SectionCard>

          <SectionCard title="Skills">
            {mentor.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mentor.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skills added yet.</p>
            )}
          </SectionCard>

          {mentor.languages.length > 0 && (
            <SectionCard title="Languages">
              <div className="flex flex-wrap gap-2">
                {mentor.languages.map((language) => (
                  <span key={language} className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground">
                    {language}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="Professional Details">
            <div className="space-y-4">
              <DetailRow label="Current Role" value={mentor.designation} />
              <DetailRow label="Company" value={mentor.company} icon={Building2} />
              <DetailRow label="Industry" value={mentor.industry} />
              <DetailRow label="Experience" value={`${mentor.experience} Years`} />
              {mentor.location && <DetailRow label="Location" value={mentor.location} icon={MapPin} />}
              <DetailRow label="Email" value={mentor.email} icon={Mail} />
              {mentor.mobile && <DetailRow label="Mobile" value={mentor.mobile} icon={Phone} />}
            </div>
          </SectionCard>

          <SectionCard title="Quick Stats">
            <div className="space-y-3">
              <StatRow label="Sessions Conducted" value={mentor.stats.sessionsConducted} />
              <StatRow label="Total Reviews" value={mentor.stats.reviewCount} />
              <StatRow
                label="Average Rating"
                value={
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {mentor.stats.averageRating.toFixed(1)}
                  </span>
                }
              />
              <StatRow
                label="Availability"
                value={
                  <span className={`flex items-center gap-1.5 ${mentor.available ? "text-emerald-600" : "text-muted-foreground"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${mentor.available ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    {mentor.available ? "Available" : "Unavailable"}
                  </span>
                }
              />
              <StatRow
                label="Profile Status"
                value={
                  <span className={mentor.verified ? "text-emerald-600" : "text-muted-foreground"}>
                    {mentor.verified ? "Verified" : "Not Verified"}
                  </span>
                }
              />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Services */}
      <SectionCard
        title="Services Offered"
        action={
          mentor.services.length > 0 ? (
            <span className="text-xs text-muted-foreground">{mentor.services.length} total</span>
          ) : undefined
        }
      >
        {mentor.services.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {mentor.services.map((service) => (
              <div
                key={service.id}
                className="rounded-xl border border-border p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold leading-tight">{service.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      service.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {service.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>

                <p className="mt-3 text-2xl font-bold text-primary">₹{service.price}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{service.duration} minutes</p>

                {service.description && (
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{service.description}</p>
                )}

                <div className="mt-4 rounded-lg bg-muted/60 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Session Type</p>
                  <p className="mt-0.5 text-xs font-semibold capitalize">{service.sessionType}</p>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors"
                >
                  Edit Service
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <ClipboardList className="mx-auto h-7 w-7 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold">No services added yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Add mentoring services to start receiving bookings.</p>
          </div>
        )}
      </SectionCard>

      {/* Availability */}
      <SectionCard
        title="Mentor Availability"
        action={
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              mentor.available ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${mentor.available ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
            {mentor.available ? "Available" : "Unavailable"}
          </span>
        }
      >
        {mentor.availability.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {mentor.availability.map((slot) => (
              <div key={slot.id} className="rounded-xl border border-border p-3 text-center">
                <p className="text-xs font-semibold">{DAYS[slot.dayOfWeek] ?? "Unknown"}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {slot.startTime} – {slot.endTime}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <CalendarDays className="mx-auto h-7 w-7 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold">No availability configured</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your available days and time slots to receive session bookings.
            </p>
          </div>
        )}
      </SectionCard>

      {/* Reviews */}
      <SectionCard
        title="Recent Reviews"
        action={
          mentor.reviews.length > 0 ? (
            <button type="button" className="text-xs font-semibold text-primary hover:underline">
              View All
            </button>
          ) : undefined
        }
      >
        {mentor.reviews.length > 0 ? (
          <div className="space-y-3">
            {mentor.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-primary/10">
                        <Users className="h-3 w-3 text-primary" />
                      </div>
                      <h3 className="text-sm font-semibold">{review.userName}</h3>
                    </div>
                    <div className="mt-1.5">
                      <StarRating value={review.rating} size="h-3.5 w-3.5" />
                    </div>
                  </div>
                  {review.submittedAt && (
                    <span className="text-[11px] text-muted-foreground">{review.submittedAt}</span>
                  )}
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Star className="mx-auto h-7 w-7 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-semibold">No reviews yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Candidate reviews will appear here after completed sessions.
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}