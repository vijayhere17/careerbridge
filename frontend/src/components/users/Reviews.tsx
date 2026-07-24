import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/auth";
import { Star, Send, X, CheckCircle2, MessageSquare, ThumbsUp, Edit2 } from "lucide-react";

type ReviewStatus = "pending" | "submitted";

interface Review {
  id: string;
  mentorName: string;
  mentorInitials: string;
  service: string;
  sessionDate: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  helpfulCount: number;
  submittedDate?: string;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: "r1",
    mentorName: "Priya Sharma",
    mentorInitials: "PS",
    service: "PM Mock Interview",
    sessionDate: "2025-07-15",
    rating: 5,
    comment: "Priya's mock interview was incredibly realistic and structured. She gave detailed, actionable feedback on my product sense and execution answers. Highly recommend for anyone preparing for PM roles at top companies!",
    status: "submitted",
    helpfulCount: 12,
    submittedDate: "2025-07-16",
  },
  {
    id: "r2",
    mentorName: "Rahul Verma",
    mentorInitials: "RV",
    service: "System Design Deep Dive",
    sessionDate: "2025-07-05",
    rating: 5,
    comment: "Rahul is an exceptional mentor for system design. He walked me through designing a URL shortener end-to-end and gave me frameworks I could apply to any problem. Cracked Amazon SDE-2 after this session!",
    status: "submitted",
    helpfulCount: 8,
    submittedDate: "2025-07-06",
  },
  {
    id: "r3",
    mentorName: "Meera Pillai",
    mentorInitials: "MP",
    service: "Resume & LinkedIn Makeover",
    sessionDate: "2025-06-28",
    rating: 0,
    comment: "",
    status: "pending",
    helpfulCount: 0,
  },
  {
    id: "r4",
    mentorName: "Anjali Menon",
    mentorInitials: "AM",
    service: "ML Interview Prep",
    sessionDate: "2025-06-20",
    rating: 4,
    comment: "Great session overall. Anjali was very knowledgeable about ML theory and gave good practice questions. Could have spent more time on coding but the conceptual depth was excellent.",
    status: "submitted",
    helpfulCount: 5,
    submittedDate: "2025-06-21",
  },
];

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(i)}
          >
            <Star className={`h-9 w-9 transition-colors ${i <= (hovered || value) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <p className="text-sm font-semibold text-primary">{labels[hovered || value]}</p>
      )}
    </div>
  );
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${sz} ${i <= rating ? "fill-primary text-primary" : "text-muted-foreground/20"}`} />
      ))}
    </div>
  );
}

function ReviewModal({ review, onClose, onSubmit }: {
  review: Review;
  onClose: () => void;
  onSubmit: (id: string, rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [step, setStep] = useState<"form" | "success">("form");

  const handleSubmit = () => {
    if (!rating) return;
    setStep("success");
    setTimeout(() => { onSubmit(review.id, rating, comment); onClose(); }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 lg:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-surface shadow-xl">
        {step === "form" ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm">{review.rating > 0 ? "Edit Review" : "Write a Review"}</h3>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {review.mentorInitials}
                </div>
                <div>
                  <p className="font-semibold text-sm">{review.mentorName}</p>
                  <p className="text-xs text-muted-foreground">{review.service}</p>
                </div>
              </div>

              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground mb-3">How was your session?</p>
                <StarInput value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  Your Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Share your experience to help other candidates…"
                  className="dash-input w-full resize-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1 text-right">{comment.length}/500</p>
              </div>

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!rating}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" /> Submit
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-12 px-6">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 mb-3">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-base">Review Submitted!</h3>
            <p className="text-sm text-muted-foreground mt-1">Thank you for your feedback.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, onEdit }: { review: Review; onEdit: (r: Review) => void }) {
  const [liked, setLiked] = useState(false);

  if (review.status === "pending") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
            {review.mentorInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{review.mentorName}</p>
            <p className="text-xs text-muted-foreground">{review.service}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Session on {new Date(review.sessionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Pending
          </span>
        </div>
        <button
          onClick={() => onEdit(review)}
          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Star className="h-3.5 w-3.5" /> Write a Review
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
          {review.mentorInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{review.mentorName}</p>
          <p className="text-xs text-muted-foreground">{review.service}</p>
          <div className="mt-1 flex items-center gap-2">
            <StarDisplay rating={review.rating} />
            <span className="text-xs font-bold">{review.rating}.0</span>
          </div>
        </div>
        <button
          onClick={() => onEdit(review)}
          className="shrink-0 rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {review.comment && (
        <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          "{review.comment}"
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {review.submittedDate
            ? new Date(review.submittedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : ""}
        </span>
        <button
          onClick={() => setLiked((l) => !l)}
          className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${liked ? "fill-primary" : ""}`} />
          {(review.helpfulCount + (liked ? 1 : 0)).toLocaleString()} helpful
        </button>
      </div>
    </div>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Review | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "submitted" | "pending">("all");

  useEffect(() => {
  const loadReviews = async () => {
    try {
      const data = await apiFetch<{ reviews: any[] }>("/api/reviews");

      setReviews(
        data.reviews.map((review) => ({
          id: review.id,
          mentorName: review.mentorName,
          mentorInitials: review.mentorInitials,
          service: review.service,
          sessionDate: review.sessionDate,
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          helpfulCount: review.helpfulCount,
          submittedDate: review.submittedDate,
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  loadReviews();
}, []);

const handleSubmit = async (
  id: string,
  rating: number,
  comment: string
) => {
  try {
    const response = await apiFetch<{
      success: boolean;
      review: any;
    }>("/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        review_id: id,
        rating,
        comment,
      }),
    });

    if (response.success) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                rating,
                comment,
                status: "submitted",
                submittedDate: response.review.submittedDate,
              }
            : r
        )
      );

      setEditTarget(null);
    }
  } catch (error) {
    console.error(error);
    alert("Failed to submit review.");
  }
};

  const submitted = reviews.filter((r) => r.status === "submitted");
  const pending   = reviews.filter((r) => r.status === "pending");
  const avgRating = submitted.length
    ? (submitted.reduce((s, r) => s + r.rating, 0) / submitted.length).toFixed(1)
    : "—";

  const filtered =
    activeTab === "all"       ? reviews   :
    activeTab === "submitted" ? submitted :
    pending;

    if (loading) {
  return (
    <div className="flex justify-center py-20">
      Loading reviews...
    </div>
  );
}

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Sessions", value: reviews.length },
          { label: "Reviews Given",  value: submitted.length },
          { label: "Avg Rating",     value: avgRating },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <MessageSquare className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            You have {pending.length} session{pending.length > 1 ? "s" : ""} waiting for your review.
          </p>
        </div>
      )}

      <div className="flex gap-1.5">
        {([
          { id: "all",       label: `All (${reviews.length})` },
          { id: "submitted", label: `Submitted (${submitted.length})` },
          { id: "pending",   label: `Pending (${pending.length})` },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted mb-3">
            <Star className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm">No reviews here</p>
          <p className="text-xs text-muted-foreground mt-1">Book a session with a mentor to leave a review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((review) => (
            <ReviewCard key={review.id} review={review} onEdit={setEditTarget} />
          ))}
        </div>
      )}

      {editTarget && (
        <ReviewModal
          review={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}