import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { SiteLayout } from "@/components/common/SiteLayout";
import { MentorCard } from "@/components/mentor/MentorCard";
import { Button } from "@/components/ui/button";
import { companies } from "@/data/companies";
import { apiFetch } from "@/lib/auth";
import type { Mentor } from "@/data/mentors";

export const Route = createFileRoute("/mentors")({
  head: () => ({
    meta: [
      { title: "Find Mentors — CareerBridge" },
      {
        name: "description",
        content:
          "Browse 1000+ verified mentors from Google, Meta, Amazon, Microsoft and more. Filter by company, role, skill, and price.",
      },
      { property: "og:title", content: "Find Mentors — CareerBridge" },
      { property: "og:url", content: "/mentors" },
    ],
    links: [{ rel: "canonical", href: "/mentors" }],
  }),
  component: MentorsPage,
});

const priceBands = [
  { id: "any", label: "Any price", min: 0, max: 9999 },
  { id: "lt40", label: "Under $40", min: 0, max: 39 },
  { id: "40-80", label: "$40 – $80", min: 40, max: 80 },
  { id: "gt80", label: "$80+", min: 81, max: 9999 },
] as const;

function MentorsPage() {
  const [q, setQ] = useState("");
  const [company, setCompany] = useState<string>("all");
  const [skill, setSkill] = useState<string>("all");
  const [price, setPrice] = useState<string>("any");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<"top" | "price-asc" | "price-desc">("top");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const band = priceBands.find((b) => b.id === price)!;
    let out = mentors.filter((m) => {
      if (availableOnly && !m.available) return false;
      if (company !== "all" && m.companySlug !== company) return false;
      if (skill !== "all" && !m.skills.includes(skill)) return false;
      if (m.pricePerSession < band.min || m.pricePerSession > band.max) return false;
      if (q) {
        const blob = `${m.name} ${m.role} ${m.company} ${m.skills.join(" ")}`.toLowerCase();
        if (!blob.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    if (sort === "price-asc") out = [...out].sort((a, b) => a.pricePerSession - b.pricePerSession);
    if (sort === "price-desc") out = [...out].sort((a, b) => b.pricePerSession - a.pricePerSession);
    if (sort === "top") out = [...out].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
    return out;
  }, [q, company, skill, price, availableOnly, sort, mentors]);

  const allSkills = useMemo(
    () => Array.from(new Set(mentors.flatMap((m) => m.skills))).sort(),
    [mentors],
  );

  const activeFilterCount = [
    company !== "all",
    skill !== "all",
    price !== "any",
    availableOnly,
  ].filter(Boolean).length;

  const clear = () => {
    setQ("");
    setCompany("all");
    setSkill("all");
    setPrice("any");
    setAvailableOnly(false);
  };

  useEffect(() => {
    let isActive = true;
    async function loadMentors() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await apiFetch<{ mentors: Mentor[] }>("/api/mentors");
        if (!isActive) return;
        setMentors(response.mentors);
      } catch (error) {
        if (!isActive) return;
        setFetchError(
          typeof error === "object" && error && "message" in error
            ? (error as { message: string }).message
            : "Unable to load mentors.",
        );
      } finally {
        if (isActive) setIsLoading(false);
      }
    }
    loadMentors();
    return () => {
      isActive = false;
    };
  }, []);

  const FilterPanel = () => (
    <div className="space-y-6">
      <FilterGroup label="Company">
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All companies</option>
          {companies.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup label="Skill">
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All skills</option>
          {allSkills.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup label="Price">
        <div className="space-y-2">
          {priceBands.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="radio"
                name="price"
                checked={price === b.id}
                onChange={() => setPrice(b.id)}
                className="accent-primary"
              />
              {b.label}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Availability">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="accent-primary"
          />
          Available now only
        </label>
      </FilterGroup>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clear} className="w-full text-muted-foreground">
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <SiteLayout>
      {/* HEADER */}
      <section className="border-b border-border bg-surface">
        <div className="container-page py-8 md:py-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Mentor marketplace
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Find your mentor.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {mentors.length}+ verified professionals from top tech companies.
          </p>

          {/* Search + controls row */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center rounded-xl border border-border bg-background px-3 shadow-sm focus-within:ring-2 focus-within:ring-ring">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, role, company…"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              {q && (
                <button onClick={() => setQ("")} aria-label="Clear search">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {/* Filter toggle — mobile only */}
              <Button
                variant="outline"
                onClick={() => setDrawerOpen((v) => !v)}
                className="relative flex-1 sm:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              {/* Sort */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="w-full appearance-none rounded-xl border border-border bg-background pl-3 pr-8 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="top">Top rated</option>
                  <option value="price-asc">Price: low → high</option>
                  <option value="price-desc">Price: high → low</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE FILTER DRAWER */}
      {drawerOpen && (
        <div className="sm:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border bg-background p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-base font-bold">Filters</p>
              <button
                onClick={() => setDrawerOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterPanel />
            <div className="mt-6 pb-2">
              <Button variant="brand" className="w-full" onClick={() => setDrawerOpen(false)}>
                Show {filtered.length} mentors
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <section className="w-full max-w-full overflow-x-hidden px-3 py-6 sm:px-6 md:container-page md:py-10">
        {isLoading && (
          <div className="rounded-3xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
            Loading mentors...
          </div>
        )}
        {fetchError && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {fetchError}
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* SIDEBAR — desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold">Filters</p>
                {activeFilterCount > 0 && (
                  <button onClick={clear} className="text-xs text-primary hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              <FilterPanel />
            </div>
          </aside>

          {/* RESULTS */}
          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> mentors
                found
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clear} className="text-xs text-primary hover:underline sm:hidden">
                  Clear filters
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
                <p className="font-display text-lg font-bold">No mentors match your filters.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try clearing some filters or broadening your search.
                </p>
                <Button onClick={clear} variant="brand" className="mt-5">
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((m, i) => (
                  <MentorCard key={m.id} mentor={m} index={i} />
                ))}
              </div>
            )}

            <div className="mt-10 rounded-2xl border border-border bg-primary-soft/40 p-5 text-center sm:p-6">
              <p className="font-display text-sm font-bold sm:text-base">
                Don't see the right mentor?
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                We're onboarding new professionals from top companies every week.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/become-a-mentor">Suggest a company</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
