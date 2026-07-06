import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Star,
  Calendar,
  MessageCircle,
  MapPin,
  Languages,
  Briefcase,
  Award,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Clock,
  Video,
} from "lucide-react";
import { SiteLayout } from "@/components/common/SiteLayout";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/auth";
import { mentors } from "@/data/mentors";
import type { Mentor } from "@/data/mentors";

export const Route = createFileRoute("/mentors/$id")({
  loader: async ({ params }): Promise<{ mentor: Mentor }> => {
    try {
      const response = await apiFetch<{ mentor: Mentor }>(`/api/mentors/${params.id}`);
      return { mentor: response.mentor };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    const m = loaderData?.mentor;
    if (!m) return {};
    return {
      meta: [
        { title: `${m.name} — ${m.role} at ${m.company} · CareerBridge` },
        { name: "description", content: m.bio },
        { property: "og:title", content: `${m.name} · ${m.role} @ ${m.company}` },
        { property: "og:description", content: m.bio },
        { property: "og:url", content: `/mentors/${m.id}` },
      ],
      links: [{ rel: "canonical", href: `/mentors/${m.id}` }],
    };
  },
  component: MentorProfile,
});

function MentorProfile() {
  const { mentor } = Route.useLoaderData() as { mentor: Mentor };
  const m = mentor;
  const related = mentors
    .filter(
      (x) =>
        x.id !== m.id &&
        (x.companySlug === m.companySlug || x.skills.some((s) => m.skills.includes(s))),
    )
    .slice(0, 3);

  return (
    <SiteLayout>
      <div className="container-page py-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/mentors">
            <ArrowLeft className="h-4 w-4" /> Back to mentors
          </Link>
        </Button>
      </div>

      {/* HERO */}
      <section className="border-b border-border bg-surface">
        <div className="container-page py-10 md:py-14">
          <div className="grid items-start gap-8 md:grid-cols-[auto_1fr_auto]">
            <div
              className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl text-2xl font-bold text-white shadow-card"
              style={{ backgroundColor: m.avatarColor }}
            >
              {m.initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                  {m.name}
                </h1>
                {m.available && (
                  <span className="rounded-full bg-secondary-soft px-2.5 py-0.5 text-xs font-semibold text-secondary">
                    ● Available
                  </span>
                )}
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                  <ShieldCheck className="mr-1 inline h-3 w-3" /> Verified
                </span>
              </div>
              <p className="mt-2 text-lg text-foreground">
                {m.role} <span className="text-muted-foreground">·</span>{" "}
                <Link
                  to="/companies/$slug"
                  params={{ slug: m.companySlug }}
                  className="font-semibold text-primary hover:underline"
                >
                  {m.company}
                </Link>
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" /> {m.experience} yrs experience
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {m.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Languages className="h-4 w-4" /> {m.languages.join(", ")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Responds {m.responseTime.toLowerCase()}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-5 text-sm">
                <span className="flex items-center gap-1 font-semibold">
                  <Star className="h-4 w-4 fill-accent text-accent" /> {m.rating.toFixed(1)}{" "}
                  <span className="text-muted-foreground">({m.reviews})</span>
                </span>
                <span className="text-muted-foreground">{m.sessions} sessions completed</span>
              </div>
            </div>
            <div className="flex w-full gap-2 md:w-auto md:flex-col">
              <Button variant="brand" size="lg" className="flex-1 md:w-52">
                <Calendar className="h-4 w-4" /> Book Session
              </Button>
              <Button variant="outline" size="lg" className="flex-1 md:w-52">
                <MessageCircle className="h-4 w-4" /> Message
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-12">
            <Block title="About Me">
              <p className="leading-relaxed text-foreground">{m.bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {m.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Block>

            <Block title="Career Journey">
              <ol className="relative space-y-6 border-l-2 border-border pl-6">
                {m.journey.map((j, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="relative"
                  >
                    <span className="absolute -left-7.75 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                    <p className="text-xs font-semibold text-primary">{j.year}</p>
                    <p className="font-display font-bold">
                      {j.title} <span className="text-muted-foreground">· {j.company}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{j.description}</p>
                  </motion.li>
                ))}
              </ol>
            </Block>

            <Block title="Achievements & Certifications">
              <div className="grid gap-4 sm:grid-cols-2">
                <ul className="space-y-2 rounded-xl border border-border bg-surface p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Achievements
                  </p>
                  {m.achievements.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Award className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {a}
                    </li>
                  ))}
                </ul>
                <ul className="space-y-2 rounded-xl border border-border bg-surface p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Certifications
                  </p>
                  {m.certifications.length === 0 && (
                    <li className="text-sm text-muted-foreground">No certifications listed.</li>
                  )}
                  {m.certifications.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            </Block>

            <Block title="Session Packages">
              <div className="grid gap-4 sm:grid-cols-2">
                {m.services.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display font-bold">{s.title}</h4>
                      <span className="font-display text-lg font-bold text-primary">
                        ${s.price}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        {s.type}
                      </span>
                    </div>
                    <Button variant="brand" size="sm" className="mt-5">
                      Book this session
                    </Button>
                  </div>
                ))}
              </div>
            </Block>

            <Block title="Reviews">
              <div className="space-y-4">
                {m.testimonials.map((t, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface p-5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                    <p className="mt-2 text-sm">"{t.text}"</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      — {t.name}, {t.role}
                    </p>
                  </div>
                ))}
              </div>
            </Block>

            {m.faqs.length > 0 && (
              <Block title="FAQs">
                <div className="divide-y divide-border rounded-xl border border-border bg-surface">
                  {m.faqs.map((f, i) => (
                    <details key={i} className="group p-5">
                      <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                        {f.q}
                        <ChevronRight className="h-4 w-4 shrink-0 transition group-open:rotate-90" />
                      </summary>
                      <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
                    </details>
                  ))}
                </div>
              </Block>
            )}
          </div>

          {/* Sticky booking card */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-card-hover">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Starts from</p>
              <p className="font-display text-3xl font-bold">
                ${m.pricePerSession}
                <span className="text-sm font-normal text-muted-foreground"> / session</span>
              </p>
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Sessions" value={m.sessions.toString()} />
                <Row label="Response time" value={m.responseTime} />
                <Row label="Languages" value={m.languages.join(", ")} />
              </div>
              <Button variant="brand" size="lg" className="mt-6 w-full">
                Check availability
              </Button>
              <Button variant="outline" size="lg" className="mt-2 w-full">
                Send a message
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Money-back guarantee on your first session
              </p>
            </div>

            {related.length > 0 && (
              <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Similar mentors
                </p>
                <ul className="mt-3 space-y-3">
                  {related.map((r) => (
                    <li key={r.id}>
                      <Link
                        to="/mentors/$id"
                        params={{ id: r.id }}
                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
                      >
                        <div
                          className="grid h-10 w-10 place-items-center rounded-xl text-xs font-bold text-white"
                          style={{ backgroundColor: r.avatarColor }}
                        >
                          {r.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{r.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.role}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* Mobile sticky booking bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-card-hover backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">From</p>
            <p className="truncate font-display text-lg font-bold leading-none">
              ${m.pricePerSession}
              <span className="ml-1 text-xs font-normal text-muted-foreground">/session</span>
            </p>
          </div>
          <Button variant="brand" size="default" className="shrink-0">
            <Calendar className="h-4 w-4" /> Book now
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
