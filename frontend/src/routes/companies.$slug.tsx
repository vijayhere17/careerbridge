import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, MapPin, Users, Building2 } from "lucide-react";
import { SiteLayout } from "@/components/common/SiteLayout";
import { Button } from "@/components/ui/button";
import { MentorCard } from "@/components/mentor/MentorCard";
import { apiFetch } from "@/lib/auth";
import { getCompany, type Company } from "@/data/companies";
import type { Mentor } from "@/data/mentors";

export const Route = createFileRoute("/companies/$slug")({
  loader: async ({ params }): Promise<{ company: Company; mentors: Mentor[] }> => {
    const company = getCompany(params.slug);
    if (!company) throw notFound();

    const response = await apiFetch<{ mentors: Mentor[] }>(
      `/api/mentors?company=${encodeURIComponent(params.slug)}`,
    );
    return { company, mentors: response.mentors };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.company;
    if (!c) return {};
    return {
      meta: [
        { title: `${c.name} hiring process & mentors — CareerBridge` },
        {
          name: "description",
          content: `Decode the ${c.name} interview loop with mentors who actually work there. ${c.description}`,
        },
        { property: "og:title", content: `${c.name} — Mentors & Interview Prep` },
        { property: "og:url", content: `/companies/${c.slug}` },
      ],
      links: [{ rel: "canonical", href: `/companies/${c.slug}` }],
    };
  },
  component: CompanyPage,
});

function CompanyPage() {
  const { company: c, mentors: companyMentors } = Route.useLoaderData() as {
    company: Company;
    mentors: Mentor[];
  };

  return (
    <SiteLayout>
      <div className="container-page py-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/companies">
            <ArrowLeft className="h-4 w-4" /> All companies
          </Link>
        </Button>
      </div>

      <section className="border-b border-border bg-surface">
        <div className="container-page py-10 md:py-14">
          <div className="flex flex-wrap items-start gap-6">
            <div
              className={
                c.logoUrl
                  ? "grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-card"
                  : "grid h-20 w-20 place-items-center rounded-3xl text-3xl font-black text-white shadow-card"
              }
              style={c.logoUrl ? undefined : { backgroundColor: c.color }}
            >
              {c.logoUrl ? (
                <img src={c.logoUrl} alt={`${c.name} logo`} className="h-12 w-12 object-contain" />
              ) : (
                c.logo
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-4xl font-bold tracking-tight">{c.name}</h1>
              <p className="mt-1 text-muted-foreground">{c.industry}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {c.headquarters}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> {c.employees} employees
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {c.mentors} mentors on CareerBridge
                </span>
              </div>
              <p className="mt-5 max-w-3xl leading-relaxed">{c.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-12 py-12 lg:grid-cols-[1fr_320px]">
        <div className="space-y-12">
          <div>
            <h2 className="font-display text-2xl font-bold">Hiring Process</h2>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2">
              {c.hiringProcess.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-card"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                    {i + 1}
                  </span>
                  <p className="font-semibold">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold">Interview Rounds</h2>
            <div className="mt-5 space-y-3">
              {c.rounds.map((r, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-5 shadow-card">
                  <h3 className="font-display text-base font-bold">{r.name}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{r.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold">Available Mentors</h2>
            {companyMentors.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                We're onboarding mentors from {c.name} now. Check back soon.
              </p>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {companyMentors.map((m, i) => (
                  <MentorCard key={m.id} mentor={m} index={i} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold">Frequently Asked Questions</h2>
            <div className="mt-5 divide-y divide-border rounded-xl border border-border bg-surface">
              {c.faqs.map((f, i) => (
                <details key={i} className="group p-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 font-semibold">
                    {f.q}
                    <ChevronRight className="h-4 w-4 transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-card-hover">
            <p className="font-display text-lg font-bold">Targeting {c.name}?</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Book a mock interview with someone who's interviewed there in the last 6 months.
            </p>
            <Button asChild variant="brand" className="mt-5 w-full">
              <Link to="/mentors">Browse {c.name} mentors</Link>
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to="/services">Explore prep services</Link>
            </Button>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}
