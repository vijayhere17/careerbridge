import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Users, Briefcase, Building2 } from "lucide-react";
import { SiteLayout } from "@/components/common/SiteLayout";
import { Button } from "@/components/ui/button";
import { getDomain, type Domain } from "@/data/domains";
import { companiesByDomain } from "@/data/companies";
import { CompanyCard } from "@/components/company/CompanyCard";
import { mentors } from "@/data/mentors";
import { MentorCard } from "@/components/mentor/MentorCard";

export const Route = createFileRoute("/domains/$slug")({
  loader: ({ params }): { domain: Domain } => {
    const d = getDomain(params.slug);
    if (!d) throw notFound();
    return { domain: d };
  },
  head: ({ loaderData }) => {
    const d = loaderData?.domain;
    if (!d) return {};
    return {
      meta: [
        { title: `${d.name} mentors & companies — CareerBridge` },
        { name: "description", content: `${d.short}. Browse verified mentors and top companies hiring in ${d.name}.` },
        { property: "og:title", content: `${d.name} on CareerBridge` },
        { property: "og:description", content: d.short },
        { property: "og:url", content: `/domains/${d.slug}` },
      ],
      links: [{ rel: "canonical", href: `/domains/${d.slug}` }],
    };
  },
  component: DomainDetail,
});

function DomainDetail() {
  const { domain: d } = Route.useLoaderData() as { domain: Domain };
  const cos = companiesByDomain(d.slug);
  const domainMentors = mentors.filter((m) =>
    cos.some((c) => c.slug === m.companySlug),
  ).slice(0, 4);

  const tint =
    d.tint === "primary" ? "bg-primary-soft text-primary"
    : d.tint === "secondary" ? "bg-secondary-soft text-secondary"
    : "bg-accent-soft text-accent";

  return (
    <SiteLayout>
      <div className="container-page py-4 md:py-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/domains"><ArrowLeft className="h-4 w-4" /> All domains</Link>
        </Button>
      </div>

      <section className="border-b border-border bg-surface">
        <div className="container-page py-8 md:py-12">
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${tint}`}>
              <d.icon className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{d.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{d.short}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-md">
                <Stat label="Mentors" value={`${d.mentorCount}+`} icon={Users} />
                <Stat label="Companies" value={`${cos.length}`} icon={Building2} />
                <Stat label="Roles" value={`${d.popularRoles.length}+`} icon={Briefcase} />
              </div>
            </div>
            <Button asChild size="lg" variant="brand" className="w-full md:w-auto">
              <Link to="/mentors">Find mentors <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          {d.popularRoles.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Popular roles</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.popularRoles.map((r) => (
                  <span key={r} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container-page py-10 md:py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Companies in {d.name}</h2>
          <Link to="/companies" className="hidden text-sm font-semibold text-primary hover:underline sm:inline">View all</Link>
        </div>
        {cos.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cos.map((c, i) => <CompanyCard key={c.slug} company={c} index={i} />)}
          </div>
        ) : (
          <EmptyState message={`We're onboarding companies in ${d.name}. Check back soon or browse mentors directly.`} />
        )}
      </section>

      {domainMentors.length > 0 && (
        <section className="container-page pb-16 md:pb-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Featured mentors</h2>
            <Link to="/mentors" className="hidden text-sm font-semibold text-primary hover:underline sm:inline">Browse all</Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {domainMentors.map((m, i) => <MentorCard key={m.id} mentor={m} index={i} />)}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="mt-1 font-display text-lg font-bold leading-none">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="brand" size="sm" className="mt-4">
        <Link to="/mentors">Browse mentors</Link>
      </Button>
    </div>
  );
}
