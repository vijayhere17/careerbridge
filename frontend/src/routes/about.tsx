import { createFileRoute } from "@tanstack/react-router";
import { Heart, Target, ShieldCheck, Users } from "lucide-react";
import { SiteLayout } from "@/components/common/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { stats } from "@/data/testimonials";
import { StatCounter } from "@/components/common/StatCounter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CareerBridge" },
      { name: "description", content: "We connect job seekers with professionals already working at top companies — for honest mentorship, not influencer advice." },
      { property: "og:title", content: "About CareerBridge" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const values = [
  { icon: Heart, title: "Honest over hype", text: "Mentors who do the work today, not influencers who left the industry." },
  { icon: Target, title: "Outcomes, not hours", text: "Every session ends with a clear next step. No vague pep talks." },
  { icon: ShieldCheck, title: "Verified, always", text: "We verify every mentor's current employer before they can list a service." },
  { icon: Users, title: "A bridge, both ways", text: "Mentors earn meaningfully. Seekers get results. Both sides win." },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-14 md:py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">About us</p>
          <h1 className="mt-3 mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            The hiring market is broken. <span className="text-primary">We're rebuilding it from the inside.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            CareerBridge exists because most career advice online is sold by people who haven't shipped code,
            owned a roadmap, or sat on a hiring panel in years. We built a marketplace where the only people
            you book are people currently inside the companies you're trying to join.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="container-page grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {stats.map((s) => <StatCounter key={s.label} {...s} />)}
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="Our values" title="What we won't compromise on." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-bold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="rounded-3xl border border-border bg-surface p-8 md:p-12">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Get in touch</h2>
          <p className="mt-2 text-muted-foreground">For partnerships, press, or feedback — we'd love to hear from you.</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <ContactRow label="General" value="hello@careerbridge.app" />
            <ContactRow label="Partnerships" value="partners@careerbridge.app" />
            <ContactRow label="Press" value="press@careerbridge.app" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display font-bold">{value}</p>
    </div>
  );
}
