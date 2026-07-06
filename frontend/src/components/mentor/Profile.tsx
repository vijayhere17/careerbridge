import {
  BadgeCheck,
  Building2,
  BriefcaseBusiness,
  Star,
  Users,
  CalendarDays,
  Award,
} from "lucide-react";

export function MentorProfile() {

  return (

    <div className="space-y-6">

      {/* Hero */}

      <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm">

        {/* Cover */}

        <div className="h-40 bg-gradient-to-r from-primary via-primary/90 to-primary/70" />

        <div className="px-8 pb-8">

          <div className="-mt-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">

              {/* Avatar */}

              <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-4 border-white bg-primary text-4xl font-bold text-white shadow-lg">

                VS

              </div>

              {/* Profile */}

              <div>

                <div className="flex flex-wrap items-center gap-3">

                  <h1 className="text-3xl font-bold">
                    Vijay Sharma
                  </h1>

                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">

                    <BadgeCheck className="h-4 w-4" />

                    Verified Mentor

                  </span>

                </div>

                <p className="mt-2 text-lg text-muted-foreground">

                  Senior Laravel Full Stack Developer

                </p>

                <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">

                  <span className="flex items-center gap-2">

                    <Building2 className="h-4 w-4" />

                    Exotic InfoTech Pvt. Ltd.

                  </span>

                  <span className="flex items-center gap-2">

                    <BriefcaseBusiness className="h-4 w-4" />

                    5+ Years Experience

                  </span>

                </div>

                <div className="mt-4 flex flex-wrap items-center gap-5">

                  <div className="flex items-center gap-1">

                    {[1,2,3,4,5].map((item)=>(

                      <Star
                        key={item}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />

                    ))}

                    <span className="ml-2 font-semibold">
                      4.9
                    </span>

                    <span className="text-muted-foreground">
                      (128 Reviews)
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* Right */}

            <div className="flex flex-wrap gap-3">

              <button className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90">

                Book Session

              </button>

              <button className="rounded-xl border border-border px-6 py-3 font-semibold hover:bg-muted">

                Message

              </button>

            </div>

          </div>

        </div>

      </div>

            {/* About & Experience */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left */}

        <div className="space-y-6 lg:col-span-2">

          {/* About */}

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

            <h2 className="mb-4 text-xl font-bold">
              About
            </h2>

            <p className="leading-7 text-muted-foreground">
              I'm a Senior Laravel Full Stack Developer with over 5 years of
              experience building scalable web applications, REST APIs and
              enterprise software. I help candidates crack technical interviews,
              improve their resumes, prepare for system design rounds and get
              referrals into top companies.
            </p>

          </div>

          {/* Skills */}

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-xl font-bold">
              Skills
            </h2>

            <div className="flex flex-wrap gap-3">

              {[
                "Laravel",
                "PHP",
                "React",
                "TypeScript",
                "Node.js",
                "MySQL",
                "REST API",
                "Docker",
                "AWS",
                "Git",
                "System Design",
                "Interview Preparation",
              ].map((skill) => (

                <span
                  key={skill}
                  className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                >
                  {skill}
                </span>

              ))}

            </div>

          </div>

        </div>

        {/* Right */}

        <div className="space-y-6">

          {/* Experience */}

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-xl font-bold">
              Experience
            </h2>

            <div className="space-y-5">

              <div>

                <h3 className="font-semibold">
                  Senior Laravel Full Stack Developer
                </h3>

                <p className="text-sm text-muted-foreground">
                  Exotic InfoTech Pvt. Ltd.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Nov 2025 - Present
                </p>

              </div>

              <div>

                <h3 className="font-semibold">
                  SEO Content Writer
                </h3>

                <p className="text-sm text-muted-foreground">
                  Digital Marketing Agency
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Aug 2024 - Oct 2025
                </p>

              </div>

            </div>

          </div>

          {/* Quick Stats */}

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

            <h2 className="mb-5 text-xl font-bold">
              Quick Stats
            </h2>

            <div className="space-y-4">

              <div className="flex items-center justify-between">

                <span className="text-muted-foreground">
                  Sessions Conducted
                </span>

                <span className="font-bold">
                  250+
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-muted-foreground">
                  Candidates Mentored
                </span>

                <span className="font-bold">
                  180+
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-muted-foreground">
                  Success Rate
                </span>

                <span className="font-bold text-green-600">
                  98%
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-muted-foreground">
                  Average Rating
                </span>

                <span className="font-bold">
                  ⭐ 4.9
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>

            {/* Services */}

      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-2xl font-bold">
              Services Offered
            </h2>

            <p className="text-muted-foreground">
              Choose the service that best fits your career goals.
            </p>

          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          {[
            {
              title: "Mock Interview",
              price: "₹999",
              duration: "60 Minutes",
              description:
                "Technical interview with detailed feedback and improvement plan.",
            },
            {
              title: "Resume Review",
              price: "₹499",
              duration: "30 Minutes",
              description:
                "ATS friendly resume review with recruiter level suggestions.",
            },
            {
              title: "Career Guidance",
              price: "₹799",
              duration: "45 Minutes",
              description:
                "Career roadmap, skill planning and company targeting.",
            },
            {
              title: "Referral Assistance",
              price: "₹1499",
              duration: "Depends",
              description:
                "Profile evaluation and referral support for eligible candidates.",
            },
          ].map((service) => (

            <div
              key={service.title}
              className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >

              <h3 className="text-lg font-bold">
                {service.title}
              </h3>

              <div className="mt-4 text-3xl font-bold text-primary">
                {service.price}
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                {service.duration}
              </p>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {service.description}
              </p>

              <button
                className="mt-6 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Book Now
              </button>

            </div>

          ))}

        </div>

      </div>

      {/* Availability */}

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h2 className="text-xl font-bold">
              Mentor Availability
            </h2>

            <p className="text-muted-foreground">
              Available for new mentoring sessions this week.
            </p>

          </div>

          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
            🟢 Available Today
          </span>

        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          {[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ].map((day) => (

            <div
              key={day}
              className="rounded-xl border border-border p-4 text-center"
            >

              <p className="font-semibold">
                {day}
              </p>

              <p className="mt-2 text-sm text-green-600">
                6 PM - 10 PM
              </p>

            </div>

          ))}

        </div>

      </div>

            {/* Achievements & Reviews */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* Achievements */}

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-bold">
            Achievements
          </h2>

          <div className="space-y-4">

            {[
              "🏆 Top Mentor 2026",
              "⭐ 4.9 Average Rating",
              "👨‍💻 250+ Sessions Completed",
              "🎯 180+ Candidates Placed",
              "🔥 98% Success Rate",
            ].map((item) => (

              <div
                key={item}
                className="rounded-xl bg-muted p-4 text-sm font-medium"
              >
                {item}
              </div>

            ))}

          </div>

        </div>

        {/* Recent Reviews */}

        <div className="lg:col-span-2 rounded-2xl border border-border bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">

            <h2 className="text-xl font-bold">
              Recent Reviews
            </h2>

            <button className="text-sm font-semibold text-primary hover:underline">
              View All Reviews
            </button>

          </div>

          <div className="space-y-5">

            {[
              {
                name: "Rahul Sharma",
                review:
                  "Amazing mentor. Helped me clear my Laravel interview at Google.",
              },
              {
                name: "Priya Shah",
                review:
                  "Excellent resume review. ATS score improved and I received interview calls.",
              },
              {
                name: "Amit Patel",
                review:
                  "Very practical career guidance with a clear roadmap.",
              },
            ].map((item) => (

              <div
                key={item.name}
                className="rounded-xl border border-border p-5"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="font-semibold">
                      {item.name}
                    </h3>

                    <div className="mt-1 flex">

                      {[1,2,3,4,5].map((i)=>(

                        <Star
                          key={i}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />

                      ))}

                    </div>

                  </div>

                </div>

                <p className="mt-4 text-muted-foreground leading-7">
                  {item.review}
                </p>

              </div>

            ))}

          </div>

        </div>

      </div>

      {/* Final CTA */}

      <div className="rounded-3xl bg-primary p-8 text-center text-primary-foreground">

        <h2 className="text-3xl font-bold">
          Ready to Crack Your Dream Interview?
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-primary-foreground/80">

          Book a personalized mentoring session and get interview preparation,
          resume review, career guidance, or referral assistance from an
          experienced industry professional.

        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">

          <button className="rounded-xl bg-white px-8 py-3 font-semibold text-primary hover:bg-gray-100">

            Book Session

          </button>

          <button className="rounded-xl border border-white px-8 py-3 font-semibold hover:bg-white/10">

            Send Message

          </button>

        </div>

      </div>

    </div>

  );

}