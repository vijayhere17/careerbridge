import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/common/SiteLayout";
import { SectionHeading } from "@/components/common/SectionHeading";
import { CompanyCard } from "@/components/company/CompanyCard";
import { companies } from "@/data/companies";

export const Route = createFileRoute("/companies")({
  head: () => ({
    meta: [
      { title: "Top Companies — CareerBridge" },
      { name: "description", content: "Decode the hiring process at Google, Meta, Amazon, Microsoft, Netflix and more. Mentors from each company, ready to coach you." },
      { property: "og:title", content: "Top Companies — CareerBridge" },
      { property: "og:url", content: "/companies" },
    ],
    links: [{ rel: "canonical", href: "/companies" }],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  return (
    <SiteLayout>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-12 md:py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Companies</p>
          <h1 className="mt-2 mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight md:text-5xl">
            500+ companies. <span className="text-primary">Real insiders</span> for each.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Browse hiring loops, interview rounds, and verified mentors actively working at the companies you're targeting.
          </p>
        </div>
      </section>
      <section className="container-page py-12">
        <SectionHeading align="left" title="Most-targeted companies" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {companies.map((c, i) => <CompanyCard key={c.slug} company={c} index={i} />)}
        </div>
      </section>
    </SiteLayout>
  );
}

