import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import { apiFetch } from "@/lib/auth";
import {
  BookingModal,
  MentorCard,
  MentorProfile,
  normalizeMentorFromApi,
  type Mentor,
  type Service,
} from "@/components/users/FindMentors";

export function SavedMentors({ onFindMentors }: { onFindMentors?: () => void }) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ mentors: any[] }>("/api/mentors/saved");
      setMentors((data.mentors ?? []).map(normalizeMentorFromApi));
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
    const previous = mentors;
    setMentors((prev) => prev.filter((m) => m.id !== id));
    if (selectedMentor?.id === id) {
      setSelectedMentor(null);
      setBookingService(null);
    }
    try {
      await apiFetch(`/api/mentors/save/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
      setMentors(previous);
      setError("Could not remove mentor from saved list.");
    }
  };

  const openProfile = async (mentorId: string) => {
    setProfileError("");
    setProfileLoading(true);

    // Show list data immediately, then refresh from profile API
    const cached = mentors.find((m) => m.id === mentorId) ?? null;
    if (cached) setSelectedMentor(cached);

    try {
      const data = await apiFetch<{ mentor: any }>(`/api/mentors/${mentorId}`);
      const full = normalizeMentorFromApi(data.mentor);
      setSelectedMentor(full);
      setMentors((prev) =>
        prev.map((m) => (m.id === mentorId ? full : m)),
      );
    } catch (err) {
      console.error(err);
      if (!cached) {
        setProfileError("Could not load mentor profile.");
        setSelectedMentor(null);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleBookingConfirm = async (
    booking: {
      mentorId: string;
      mentorName: string;
      service: string;
      serviceId: string;
      sessionType: Service["type"];
      date: string;
      time: string;
      amount: number;
      requirements?: string;
    },
  ) => {
    await apiFetch("/api/bookings", {
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
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              isSaved
              onSave={() => void remove(mentor.id)}
              onView={() => void openProfile(mentor.id)}
            />
          ))}
        </div>
      )}

      {profileError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {profileError}
        </div>
      )}

      {profileLoading && !selectedMentor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="rounded-xl bg-surface px-5 py-4 text-sm font-medium shadow-lg">
            Loading mentor profile…
          </div>
        </div>
      )}

      {selectedMentor && (
        <MentorProfile
          mentor={selectedMentor}
          isSaved
          onSave={() => void remove(selectedMentor.id)}
          onBook={(service) => setBookingService(service)}
          onClose={() => {
            setSelectedMentor(null);
            setBookingService(null);
            setProfileError("");
          }}
        />
      )}

      {bookingService && selectedMentor && (
        <BookingModal
          mentor={selectedMentor}
          service={bookingService}
          onClose={() => setBookingService(null)}
          onConfirm={handleBookingConfirm}
        />
      )}
    </div>
  );
}
