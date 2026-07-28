import { useEffect, useState } from "react";
import {
  BookmarkCheck, MapPin, Star, Search, Trash2,
  BadgeCheck, Users,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

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
}

export function SavedMentors({ onFindMentors }: { onFindMentors?: () => void }) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ mentors: any[] }>("/api/mentors/saved");
      setMentors(
        (data.mentors ?? []).map((m) => ({
          id: String(m.id),
          name: m.name,
          initials: m.initials || (m.name || "M").slice(0, 2).toUpperCase(),
          role: m.role || m.designation || "Mentor",
          company: m.company || "—",
          industry: m.industry || "—",
          location: m.location || "—",
          rating: Number(m.rating ?? 0),
          reviewCount: Number(m.reviews ?? 0),
          sessionCount: Number(m.sessions ?? 0),
          verified: Boolean(m.verified),
          available: Boolean(m.available),
          skills: m.skills ?? [],
          minPrice: Number(m.pricePerSession ?? 0),
        })),
      );
    } catch (err) {
      console.error(err);
      setError("Could not load saved mentors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const remove = async (id: string) => {
    setMentors((prev) => prev.filter((m) => m.id !== id));
    try {
      await apiFetch(`/api/mentors/save/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
      void load();
    }
  };

  const filtered = mentors.filter((m) => {
    const q = search.toLowerCase();
    return (
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      m.company.toLowerCase().includes(q) ||
      m.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Mentors</h1>
          <p className="text-sm text-muted-foreground">{mentors.length} mentors saved</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved mentors…"
            className="dash-input w-full pl-9"
          />
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button className="ml-3 underline" onClick={() => void load()}>Retry</button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">No saved mentors</p>
          <p className="mt-1 text-sm text-muted-foreground">Bookmark mentors while browsing to find them here.</p>
          {onFindMentors && (
            <button
              onClick={onFindMentors}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Find Mentors
            </button>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((mentor) => (
            <div key={mentor.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {mentor.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm">{mentor.name}</p>
                        {mentor.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {mentor.role} · {mentor.company}
                      </p>
                    </div>
                    <button
                      onClick={() => void remove(mentor.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-red-600"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      {mentor.rating.toFixed(1)} ({mentor.reviewCount})
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {mentor.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BookmarkCheck className="h-3.5 w-3.5" />
                      From ₹{mentor.minPrice.toLocaleString()}
                    </span>
                    <span className={mentor.available ? "text-primary" : "text-amber-600"}>
                      {mentor.available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  {mentor.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {mentor.skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-lg bg-muted px-2 py-0.5 text-[11px] font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
