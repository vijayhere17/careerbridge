import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/common/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — CareerBridge" },
      { name: "description", content: "Pay per session, or unlock unlimited mentorship with CareerBridge Plus." },
      { property: "og:title", content: "Pricing — CareerBridge" },
      { property: "og:url", content: "/pricing" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Pay-as-you-go",
    price: "$0",
    period: "to join",
    desc: "Browse mentors and pay only for what you book.",
    cta: "Find Mentors",
    href: "/mentors",
    highlight: false,
    features: [
      "Browse all 1,000+ mentors",
      "Pay per session — no subscription",
      "Money-back on first session",
      "Save unlimited mentors",
      "Track sessions in your dashboard",
    ],
  },
  {
    name: "CareerBridge Plus",
    price: "$39",
    period: "/ month",
    desc: "Unlimited resume reviews and weekly 1:1s. Best for active job hunts.",
    cta: "Start 7-day trial",
    href: "/signup",
    highlight: true,
    features: [
      "Everything in Pay-as-you-go",
      "2 mentor sessions per month included",
      "Unlimited resume reviews",
      "10% off any extra session",
      "Priority referral matching",
      "Cancel anytime",
    ],
  },
  {
    name: "Teams & Bootcamps",
    price: "Custom",
    period: "billed annually",
    desc: "For bootcamps and university career centers placing 10+ candidates per month.",
    cta: "Contact sales",
    href: "/about",
    highlight: false,
    features: [
      "Volume pricing on sessions",
      "Cohort analytics dashboard",
      "Dedicated mentor pool",
      "SSO and admin controls",
      "Custom branded portal",
    ],
  },
];

function PricingPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-14 md:py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Simple, transparent pricing
          </span>
          <h1 className="mt-4 mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            Pay for outcomes, not <span className="text-primary">platitudes</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            No long-term contracts. No upsells. Cancel any time.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-3xl border bg-surface p-7 shadow-card ${
                p.highlight ? "border-primary shadow-glow lg:-translate-y-3" : "border-border"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-card">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.desc}</p>
              <p className="mt-6 font-display">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="ml-1 text-sm font-normal text-muted-foreground">{p.period}</span>
              </p>
              <Button asChild variant={p.highlight ? "brand" : "outline"} size="lg" className="mt-6">
                <Link to={p.href}>{p.cta}</Link>
              </Button>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <SectionHeading eyebrow="FAQ" title="Pricing questions, answered." />
        <div className="mx-auto mt-8 max-w-2xl divide-y divide-border rounded-2xl border border-border bg-surface">
          {[
            { q: "Do mentors set their own prices?", a: "Yes. Pricing varies by mentor experience, company, and service type. You see the price before you book." },
            { q: "What's the money-back guarantee?", a: "If your first session isn't useful, contact support within 48 hours for a full refund." },
            { q: "How do mentors get paid?", a: "Mentors keep 85% of every session. Payouts run weekly via Stripe or local bank transfer." },
            { q: "Can I cancel Plus anytime?", a: "Yes — cancel from your dashboard with no penalty." },
          ].map((f, i) => (
            <details key={i} className="group p-5">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
