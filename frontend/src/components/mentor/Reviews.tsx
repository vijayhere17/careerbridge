import { useMemo, useState } from "react";
import {
  Search,
  Star,
  MessageCircle,
  Filter,
  Calendar,
  Building2,
  TrendingUp,
} from "lucide-react";

interface Review {
  id: number;
  candidate: string;
  company: string;
  service: string;
  rating: number;
  review: string;
  date: string;
}

const reviews: Review[] = [
  {
    id: 1,
    candidate: "Rahul Sharma",
    company: "Google",
    service: "Mock Interview",
    rating: 5,
    review:
      "Amazing mentor. Helped me prepare for system design and Laravel interview. Cleared Google interview successfully.",
    date: "21 Jun 2026",
  },
  {
    id: 2,
    candidate: "Priya Shah",
    company: "Adobe",
    service: "Resume Review",
    rating: 5,
    review:
      "Very detailed feedback. Resume ATS score improved a lot.",
    date: "18 Jun 2026",
  },
  {
    id: 3,
    candidate: "Amit Patel",
    company: "Infosys",
    service: "Career Guidance",
    rating: 4,
    review:
      "Good guidance about career switch.",
    date: "14 Jun 2026",
  },
];

export function MentorReviews() {

  const [search, setSearch] = useState("");

  const filteredReviews = useMemo(() => {

    return reviews.filter((item) =>
      item.candidate.toLowerCase().includes(search.toLowerCase()) ||
      item.company.toLowerCase().includes(search.toLowerCase()) ||
      item.service.toLowerCase().includes(search.toLowerCase())
    );

  }, [search]);

  const totalReviews = reviews.length;

  const averageRating =
    reviews.reduce((sum, item) => sum + item.rating, 0) /
    reviews.length;

  const positivePercentage =
    Math.round(
      (reviews.filter(r => r.rating >= 4).length /
        reviews.length) *
        100
    );

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
            value: averageRating.toFixed(1),
            icon: Star,
            color: "bg-yellow-50 text-yellow-600",
          },
          {
            title: "Total Reviews",
            value: totalReviews,
            icon: MessageCircle,
            color: "bg-blue-50 text-blue-600",
          },
          {
            title: "Positive",
            value: `${positivePercentage}%`,
            icon: TrendingUp,
            color: "bg-green-50 text-green-600",
          },
          {
            title: "This Month",
            value: "26",
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

                  {review.candidate
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

                    {review.review}

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

          {[
            { star: 5, value: 85 },
            { star: 4, value: 10 },
            { star: 3, value: 3 },
            { star: 2, value: 1 },
            { star: 1, value: 1 },
          ].map((item) => (

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
                    width: `${item.value}%`,
                  }}
                />

              </div>

              <span className="w-10 text-right text-sm text-muted-foreground">
                {item.value}%
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
                Mock Interview Preparation consistently receives
                the highest ratings from candidates.
              </p>

            </div>

            <div className="rounded-xl bg-green-50 p-5">

              <h3 className="font-semibold">
                Candidate Satisfaction
              </h3>

              <p className="mt-2 text-muted-foreground">
                98% of candidates recommend you for interview
                preparation and resume reviews.
              </p>

            </div>

            <div className="rounded-xl bg-blue-50 p-5">

              <h3 className="font-semibold">
                Average Response Time
              </h3>

              <p className="mt-2 text-muted-foreground">
                12 minutes average response to new mentoring requests.
              </p>

            </div>

            <div className="rounded-xl bg-orange-50 p-5">

              <h3 className="font-semibold">
                Repeat Clients
              </h3>

              <p className="mt-2 text-muted-foreground">
                42% of candidates book more than one mentoring session.
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