import { createFileRoute, Link } from "@tanstack/react-router";
import { DollarSign, Clock, Globe, BadgeCheck, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/common/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/become-a-mentor")({
  head: () => ({
    meta: [
      { title: "Become a Mentor — Earn from your expertise · CareerBridge" },
      { name: "description", content: "Earn $2k–$10k/mo coaching the next generation of engineers, PMs, and designers. Set your price, set your hours." },
      { property: "og:title", content: "Become a Mentor — CareerBridge" },
      { property: "og:url", content: "/become-a-mentor" },
    ],
    links: [{ rel: "canonical", href: "/become-a-mentor" }],
  }),
  component: BecomeMentorPage,
});

const perks = [
  { icon: DollarSign, title: "Keep 85% of every session", text: "Industry-leading payout. Weekly bank transfers via Stripe." },
  { icon: Clock, title: "Work on your own time", text: "Sync your calendar. Open as few or as many slots as you want." },
  { icon: Globe, title: "Reach a global audience", text: "Candidates from 60+ countries actively booking sessions." },
  { icon: BadgeCheck, title: "Build a public reputation", text: "Verified profile. Reviews after every session. Compounding credibility." },
];

const steps = [
  { n: 1, title: "Apply in 5 minutes", text: "Tell us about your current role and what you'd like to coach." },
  { n: 2, title: "Verify your employer", text: "We verify via your work email — your privacy is protected." },
  { n: 3, title: "Launch your services", text: "Pick the services you offer, set prices, and connect your calendar." },
  { n: 4, title: "Start earning", text: "Get matched with candidates and get paid weekly." },
];

function BecomeMentorPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden gradient-hero">
        <div className="container-page grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-secondary-soft px-3 py-1 text-xs font-semibold text-secondary">For working professionals</span>
            <h1 className="mt-4 text-balance font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Turn your work experience into <span className="text-primary">monthly income</span>.
            </h1>
            <p className="mt-5 max-w-xl text-muted-foreground md:text-lg">
              Coach the next generation of talent in your spare time. Top mentors on CareerBridge earn
              $2,000 – $10,000 per month from 4–8 hours per week.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="brand"><Link to="/signup">Apply to mentor <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/mentors">See what mentors offer</Link></Button>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-surface p-7 shadow-card-hover">
            <p className="text-sm font-semibold text-muted-foreground">Estimated monthly earnings</p>
            <div className="mt-4 space-y-4">
              {[
                { hrs: "4 hrs / week", low: 720, high: 1700 },
                { hrs: "8 hrs / week", low: 1500, high: 3800 },
                { hrs: "12 hrs / week", low: 2400, high: 6500 },
              ].map((row) => (
                <div key={row.hrs} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <span className="text-sm font-semibold">{row.hrs}</span>
                  <span className="font-display text-base font-bold text-primary">
                    ${row.low.toLocaleString()} – ${row.high.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Based on the median paid mentor on CareerBridge. Not a guarantee.</p>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <SectionHeading eyebrow="Why mentor here" title="Built for working professionals." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-bold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Getting started" title="Live in 24 hours." />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl border border-border bg-background p-6 shadow-card">
                <span className="font-display text-3xl font-black text-primary-soft">0{s.n}</span>
                <h3 className="mt-2 font-display font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild variant="brand" size="lg"><Link to="/signup">Apply now</Link></Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
