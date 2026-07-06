import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { SiteLayout } from "@/components/common/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { domains } from "@/data/domains";

export const Route = createFileRoute("/domains")({
  head: () => ({
    meta: [
      { title: "Browse Domains — CareerBridge" },
      { name: "description", content: "Explore mentors across IT, Pharma, Chemical, Automobile, Finance, Consulting and 20+ more domains. Find experts working in your target industry." },
      { property: "og:title", content: "Browse Domains — CareerBridge" },
      { property: "og:description", content: "Mentors across 25+ industries — from Software to Pharma to Manufacturing." },
      { property: "og:url", content: "/domains" },
    ],
    links: [{ rel: "canonical", href: "/domains" }],
  }),
  component: DomainsPage,
});

function DomainsPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-10 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Domains</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            Find mentors in <span className="text-primary">every industry.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            25+ domains, hundreds of companies, thousands of verified professionals — pick the field you're aiming for.
          </p>
          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-background p-2 shadow-card">
            <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              placeholder="Search domains (IT, Pharma, Auto, Finance…)"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        <SectionHeading align="left" title="All domains" description={`${domains.length} industries · ${domains.reduce((a, d) => a + d.mentorCount, 0).toLocaleString()}+ verified mentors`} />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {domains.map((d, i) => {
            const tint =
              d.tint === "primary" ? "bg-primary-soft text-primary"
              : d.tint === "secondary" ? "bg-secondary-soft text-secondary"
              : "bg-accent-soft text-accent";
            return (
              <motion.div
                key={d.slug}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.25) }}
              >
                <Link
                  to="/domains/$slug"
                  params={{ slug: d.slug }}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>
                    <d.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-sm font-bold leading-snug sm:text-base">{d.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.short}</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{d.mentorCount} mentors</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  );
}
