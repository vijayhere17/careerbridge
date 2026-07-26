import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Star,
  MessageCircle,
  Filter,
  Calendar,
  Building2,
  TrendingUp,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";

interface Review {
    id: string;
    candidate: string;
    candidate_photo: string | null;
    company: string;
    service: string;
    rating: number;
    comment: string;
    date: string;
}

interface Summary {
  average_rating: number;
  total_reviews: number;
  positive_percentage: number;
  this_month: number;
}

interface Distribution {
  star: number;
  count: number;
  percentage: number;
}

export function MentorReviews() {

  const [search, setSearch] = useState("");

const [reviews, setReviews] = useState<Review[]>([]);

const [summary, setSummary] = useState<Summary>({
  average_rating: 0,
  total_reviews: 0,
  positive_percentage: 0,
  this_month: 0,
});

const [distribution, setDistribution] = useState<Distribution[]>([]);

const [loading, setLoading] = useState(true);

  const [insights, setInsights] = useState({
    strongest_area: "Mentoring sessions",
    candidate_satisfaction: 0,
    repeat_client_percentage: 0,
    this_month_reviews: 0,
  });

  const filteredReviews = useMemo(() => {

    return reviews.filter((item) =>
      item.candidate.toLowerCase().includes(search.toLowerCase()) ||
      item.company.toLowerCase().includes(search.toLowerCase()) ||
      item.service.toLowerCase().includes(search.toLowerCase())
    );

  }, [search, reviews]);



    useEffect(() => {
  loadReviews();
}, []);

const loadReviews = async () => {
  try {

    const response = await apiFetch<{
      summary: Summary;
      distribution: Distribution[];
      insights?: {
        strongest_area?: string;
        candidate_satisfaction?: number;
        repeat_client_percentage?: number;
        this_month_reviews?: number;
      };
      reviews: Review[];
    }>("/api/mentor/reviews");

    setSummary(response.summary);
    if (response.insights) {
      setInsights({
        strongest_area: response.insights.strongest_area ?? "Mentoring sessions",
        candidate_satisfaction: response.insights.candidate_satisfaction ?? response.summary.positive_percentage,
        repeat_client_percentage: response.insights.repeat_client_percentage ?? 0,
        this_month_reviews: response.insights.this_month_reviews ?? response.summary.this_month,
      });
    }

    setDistribution(response.distribution);

    setReviews(response.reviews);

  } catch (error) {

    console.error(error);

  } finally {

    setLoading(false);

  }
};

if (loading) {
  return (
    <div className="flex h-64 items-center justify-center">
      Loading reviews...
    </div>
  );
}

  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-2xl font-bold">
            Reviews & Ratings
          </h1>

          <p className="text-sm text-muted-foreground">
            Candidate feedback and mentor reputation.
          </p>

        </div>

      </div>

      {/* Summary */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">

        {[
          {
  title: "Average Rating",
  value: summary.average_rating.toFixed(1),
            icon: Star,
            color: "bg-yellow-50 text-yellow-600",
          },
          {
  title: "Total Reviews",
  value: summary.total_reviews,
            icon: MessageCircle,
            color: "bg-blue-50 text-blue-600",
          },
          {
  title: "Positive",
  value: `${summary.positive_percentage}%`,
            icon: TrendingUp,
            color: "bg-green-50 text-green-600",
          },
          {
  title: "This Month",
  value: summary.this_month,
            icon: Calendar,
            color: "bg-violet-50 text-violet-600",
          },

        ].map((card) => {

          const Icon = card.icon;

          return (

            <div
              key={card.title}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >

              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}
              >

                <Icon className="h-6 w-6" />

              </div>

              <h2 className="text-2xl font-bold">
                {card.value}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {card.title}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, company or service..."
              className="h-11 w-full rounded-xl border border-border pl-10 pr-3 outline-none focus:border-primary"
            />

          </div>

          <button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 hover:bg-muted">

            <Filter className="h-4 w-4" />

            Filter

          </button>

        </div>

      </div>

            {/* Reviews List */}

      <div className="space-y-5">

        {filteredReviews.map((review) => (

          <div
            key={review.id}
            className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:shadow-md"
          >

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

              {/* Left */}

              <div className="flex gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">

                  {(review.candidate ?? "User")
    .split(" ")
                    .map((n) => n[0])
                    .join("")}

                </div>

                <div>

                  <div className="flex flex-wrap items-center gap-3">

                    <h3 className="text-lg font-semibold">
                      {review.candidate}
                    </h3>

                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {review.service}
                    </span>

                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">

                    <span className="flex items-center gap-1">

                      <Building2 className="h-4 w-4" />

                      {review.company}

                    </span>

                    <span className="flex items-center gap-1">

                      <Calendar className="h-4 w-4" />

                      {review.date}

                    </span>

                  </div>

                  <div className="mt-3 flex">

                    {Array.from({ length: 5 }).map((_, index) => (

                      <Star
                        key={index}
                        className={`h-5 w-5 ${
                          index < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />

                    ))}

                  </div>

                  <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">

                    {review.comment}

                  </p>

                </div>

              </div>

              {/* Right */}

              <div className="flex flex-col gap-3 lg:w-44">

                <button
                  className="rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90"
                >

                  Reply

                </button>

                <button
                  className="rounded-xl border border-border px-4 py-2 font-medium hover:bg-muted"
                >

                  View Profile

                </button>

              </div>

            </div>

          </div>

        ))}

      </div>
            {/* Rating Distribution */}

      <div className="grid gap-6 xl:grid-cols-3">

        {/* Rating Breakdown */}

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold">
            Rating Distribution
          </h2>

          <p className="mb-6 text-sm text-muted-foreground">
            Overall candidate feedback
          </p>

          {distribution.map((item) => (

            <div
              key={item.star}
              className="mb-4 flex items-center gap-4"
            >

              <div className="flex w-12 items-center gap-1">

                <span className="font-medium">
                  {item.star}
                </span>

                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

              </div>

              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">

                <div
                  className="h-full rounded-full bg-yellow-400"
                 style={{
    width: `${item.percentage}%`,
}}
                />

              </div>

              <span className="w-10 text-right text-sm text-muted-foreground">
                {item.percentage}%
              </span>

            </div>

          ))}

        </div>

        {/* Review Insights */}

        <div className="xl:col-span-2 rounded-2xl border border-border bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold">
            Review Insights
          </h2>

          <p className="mb-6 text-sm text-muted-foreground">
            What candidates appreciate most
          </p>

          <div className="grid gap-4 md:grid-cols-2">

            <div className="rounded-xl bg-primary/5 p-5">

              <h3 className="font-semibold">
                Strongest Area
              </h3>

              <p className="mt-2 text-muted-foreground">
                {insights.strongest_area} consistently receives
                the highest ratings from candidates.
              </p>

            </div>

            <div className="rounded-xl bg-green-50 p-5">

              <h3 className="font-semibold">
                Candidate Satisfaction
              </h3>

              <p className="mt-2 text-muted-foreground">
                {insights.candidate_satisfaction}% of candidates leave a
                positive rating (4★ or higher).
              </p>

            </div>

            <div className="rounded-xl bg-blue-50 p-5">

              <h3 className="font-semibold">
                This Month
              </h3>

              <p className="mt-2 text-muted-foreground">
                {insights.this_month_reviews} new reviews received this month.
              </p>

            </div>

            <div className="rounded-xl bg-orange-50 p-5">

              <h3 className="font-semibold">
                Repeat Clients
              </h3>

              <p className="mt-2 text-muted-foreground">
                {insights.repeat_client_percentage}% of candidates book more than one mentoring session.
              </p>

            </div>

          </div>

        </div>

      </div>

            {filteredReviews.length === 0 && (

        <div className="rounded-2xl border border-dashed border-border bg-white py-16 text-center">

          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />

          <h2 className="mt-5 text-xl font-semibold">
            No Reviews Found
          </h2>

          <p className="mt-2 text-muted-foreground">
            No reviews match your current search.
          </p>

        </div>

      )}

          </div>

  );

}
