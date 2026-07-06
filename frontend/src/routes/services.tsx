import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/common/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { services } from "@/data/services";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Career Services — CareerBridge" },
      { name: "description", content: "Resume reviews, mock interviews, referrals, salary negotiation, and more — delivered by professionals at top companies." },
      { property: "og:title", content: "Career Services — CareerBridge" },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-12 md:py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Career Services</p>
          <h1 className="mt-2 mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            One service for every step. From resume to <span className="text-primary">signed offer</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Pick a service, pick a mentor, pick a time. Every session ends with a written summary and next steps.
          </p>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <motion.article
              key={s.slug}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
              className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
            >
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${
                s.tone === "primary" ? "bg-primary-soft text-primary"
                : s.tone === "secondary" ? "bg-secondary-soft text-secondary"
                : "bg-accent-soft text-accent"
              }`}>
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-1.5 text-sm font-medium text-foreground/80">{s.short}</p>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">{s.duration}</p>
                  <p className="font-display text-base font-bold">From ${s.startsAt}</p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/mentors">Browse mentors <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="What's included"
            title="Every session comes with."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Pre-session intake form",
              "Live 1:1 video session",
              "Written feedback summary",
              "Action plan with next steps",
              "Resource recommendations",
              "Follow-up Q&A window",
              "Money-back guarantee",
              "Verified mentor only",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2 rounded-xl border border-border bg-background p-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                <span className="text-sm font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
