import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/common/SiteLayout";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — CareerBridge" },
      { name: "description", content: "Stories, playbooks, and breakdowns from people inside top tech companies." },
      { property: "og:title", content: "Blog — CareerBridge" },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogPage,
});

const posts = [
  { title: "What a Google L5 system design interview actually looks like", tag: "System Design", read: "9 min", author: "Aarav M." },
  { title: "Rewriting Amazon LP stories: a worked example", tag: "Behavioral", read: "7 min", author: "Daniel O." },
  { title: "The frontend interview is changing. Here's how.", tag: "Frontend", read: "6 min", author: "Sofia P." },
  { title: "From data analyst to data scientist in 6 months", tag: "Career Switch", read: "11 min", author: "Isha V." },
  { title: "The honest playbook for getting a Meta referral", tag: "Referrals", read: "8 min", author: "Sofia P." },
  { title: "Why Netflix only hires senior engineers", tag: "Hiring", read: "5 min", author: "Mira H." },
];

function BlogPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Blog</p>
          <h1 className="mt-2 mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            Playbooks from inside top companies.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Written by mentors actually doing the work — not influencers.
          </p>
        </div>
      </section>
      <section className="container-page py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <article key={i} className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
              <span className="inline-block w-fit rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">{p.tag}</span>
              <h2 className="mt-3 font-display text-lg font-bold">{p.title}</h2>
              <div className="mt-auto pt-5 flex items-center justify-between text-xs text-muted-foreground">
                <span>By {p.author}</span><span>{p.read} read</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
