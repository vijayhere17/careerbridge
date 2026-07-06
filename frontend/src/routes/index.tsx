import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { SiteLayout } from "@/components/common/SiteLayout";
import { CompanyCard } from "@/components/company/CompanyCard";
import { Button } from "@/components/ui/button";
import { companies } from "@/data/companies";
import { services } from "@/data/services";
import { stats, testimonials } from "@/data/testimonials";
import { domains } from "@/data/domains";
import heroImg from "@/assets/hero-mentorship.jpg";
import {
  Search, Star, ArrowRight, CheckCircle2, ShieldCheck,
  Calendar, Trophy, Sparkles, Users, Building2, Award, Clock,
  Target, FileText, Handshake, Briefcase, Brain, TrendingUp, Gift,
} from "lucide-react";


function CountUp({ to, duration = 1500 }: { to: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerBridge — Mentorship & Referrals from people inside top companies" },
      { name: "description", content: "Book mock interviews, resume reviews, and referrals from professionals at Google, Meta, Amazon, Microsoft and more." },
    ],
  }),
  component: Home,
});

const popularSearches = ["Google", "Meta", "Amazon", "Frontend", "Data Science", "PM"];

function FadeUp({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Home() {
  return (
    <SiteLayout>

      {/* ── HERO: full bleed image, text anchored bottom ── */}
      <section className="relative h-[85vh] min-h-[500px] max-h-[750px] overflow-hidden">
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/85" />

        <div className="relative z-10 flex h-full flex-col items-center justify-end px-5 pb-8 text-center sm:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm"
          >
            <Sparkles className="h-3 w-3" />
            Trusted by 25,000+ job seekers
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.07 }}
            className="font-display text-[2.6rem] font-bold leading-none tracking-tight text-white sm:text-5xl"
          >
            CareerBridge
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.13 }}
            className="mt-2 text-base font-medium text-white/80 sm:text-lg"
          >
            India's #1 career mentorship platform
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mt-5 w-full max-w-sm"
          >
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-2xl">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                placeholder="Company, role, or skill…"
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
              <Button asChild size="sm" variant="brand" className="shrink-0 rounded-lg h-8 px-3 text-xs">
                <Link to="/mentors">Search</Link>
              </Button>
            </div>
            <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
              {popularSearches.map((t) => (
                <Link
                  key={t}
                  to="/mentors"
                  className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/20"
                >
                  {t}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex flex-wrap justify-center gap-4 text-[11px] text-white/60"
          >
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-white/80" /> Verified mentors</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-white/80" /> Money-back guarantee</span>
          </motion.div>
        </div>
      </section>

    {/* ── BETTER CAREERS FOR MORE PEOPLE ── */}
<section className="overflow-hidden bg-white px-5 py-12 md:py-16">
  <div className="mx-auto max-w-md">
    <FadeUp>
      <h2 className="font-display text-3xl font-bold leading-tight text-primary sm:text-4xl">
        Better careers for<br />more people
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
        For years we've helped thousands of candidates get referred and hired at their dream companies — by people already inside.
      </p>
    </FadeUp>

    <div className="relative mt-10 space-y-3">
      {[
        { icon: Users,     value: 25000, suffix: "+", label: "candidates placed",  delay: 0     },
        { icon: Building2, value: 500,   suffix: "+", label: "companies covered",  delay: 0.07  },
        { icon: Award,     value: 1000,  suffix: "+", label: "verified mentors",   delay: 0.14  },
      ].map((s, i) => (
        <FadeUp key={s.label} delay={s.delay}>
          <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-gray-900">
                <CountUp to={s.value} duration={1400 + i * 100} />{s.suffix}
              </p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        </FadeUp>
      ))}
    </div>
  </div>
</section>

{/* ── WHAT'S WAITING ── */}
<section className="bg-gray-50/80 px-5 py-12 md:py-16">
  <div className="mx-auto max-w-md">
    <FadeUp className="text-center">
      <h2 className="font-display text-2xl font-bold text-primary sm:text-3xl">
        What's waiting for<br />you on CareerBridge?
      </h2>
      <p className="mt-2 text-sm text-gray-500">
        Everything you need to go from job seeker to offer holder.
      </p>
    </FadeUp>

    <div className="mt-8 grid grid-cols-3 gap-2">
      {[
        { icon: Target,     label: "Mock Interviews"    },
        { icon: FileText,   label: "Resume Review"      },
        { icon: Handshake,  label: "Referrals"          },
        { icon: Briefcase,  label: "Job Strategy"       },
        { icon: Brain,      label: "System Design"      },
        { icon: TrendingUp, label: "Offer Negotiation"  },
        { icon: Building2,  label: "Company Insights"   },
        { icon: Star,       label: "Top Mentors"        },
        { icon: Gift,       label: "Free Resources"     },
      ].map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.24), ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/services"
            className="group flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 bg-white transition-all hover:border-primary/20 hover:bg-primary/[0.03] active:scale-[0.97]"
          >
            <item.icon
              className="h-5 w-5 shrink-0 text-primary opacity-70 transition-opacity group-hover:opacity-100"
              strokeWidth={1.5}
            />
            <span className="line-clamp-2 w-full px-2 text-center text-[10px] font-semibold leading-tight text-gray-600 group-hover:text-primary">
              {item.label}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  </div>
</section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white px-5 py-12 md:py-16">
        <div className="mx-auto max-w-md">
          <FadeUp>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">How it works</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-gray-900 sm:text-3xl">
              Three steps to hired.
            </h2>
          </FadeUp>

          <div className="mt-7 space-y-3">
            {[
              { icon: Search, num: "01", title: "Find a mentor", text: "Filter by company, role, or skill — 1,000+ verified pros." },
              { icon: Calendar, num: "02", title: "Book a session", text: "Pick a time that works and pay securely online." },
              { icon: Trophy, num: "03", title: "Land the offer", text: "Practice, get feedback, get referred when you're ready." },
            ].map((s, i) => (
              <FadeUp key={s.title} delay={i * 0.07}>
                <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">{s.title}</p>
                      <span className="text-xs font-black text-primary/20">{s.num}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{s.text}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPANIES ── */}
      <section className="border-t border-gray-100 bg-gray-50 px-5 py-12 md:py-14">
        <div className="mx-auto max-w-lg">
          <FadeUp className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Top companies</p>
              <h2 className="mt-1 font-display text-xl font-bold text-gray-900 sm:text-2xl">
                Get inside the company you want.
              </h2>
            </div>
            <Link to="/companies" className="shrink-0 text-xs font-semibold text-primary hover:underline">
              See all
            </Link>
          </FadeUp>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {companies.slice(0, 6).map((c, i) => (
              <FadeUp key={c.slug} delay={Math.min(i * 0.05, 0.2)}>
                <CompanyCard company={c} index={i} />
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.2} className="mt-4">
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link to="/companies">Browse all companies <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </FadeUp>
        </div>
      </section>

{/* ── DOMAINS ── */}
<section className="bg-white px-5 py-12 md:py-14">
  <div className="mx-auto max-w-lg">
    <FadeUp className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Domains</p>
        <h2 className="mt-1 font-display text-xl font-bold text-gray-900 sm:text-2xl">
          Mentors in every industry.
        </h2>
      </div>
      <Link to="/domains" className="shrink-0 text-xs font-semibold text-primary hover:underline">
        See all
      </Link>
    </FadeUp>

    <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {domains.slice(0, 12).map((d, i) => {
        const palette = [
          { bg: "bg-primary/10",  text: "text-primary"        },
          { bg: "bg-indigo-100",  text: "text-indigo-600"     },
          { bg: "bg-primary/15",  text: "text-primary"        },
          { bg: "bg-violet-100",  text: "text-violet-600"     },
          { bg: "bg-blue-100",    text: "text-blue-600"       },
          { bg: "bg-primary/10",  text: "text-primary"        },
          { bg: "bg-indigo-100",  text: "text-indigo-600"     },
          { bg: "bg-violet-100",  text: "text-violet-600"     },
          { bg: "bg-primary/15",  text: "text-primary"        },
          { bg: "bg-blue-100",    text: "text-blue-600"       },
          { bg: "bg-indigo-100",  text: "text-indigo-600"     },
          { bg: "bg-primary/10",  text: "text-primary"        },
        ][i % 12];

        return (
          <motion.div
            key={d.slug}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.38, delay: Math.min(i * 0.045, 0.28), ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2, transition: { duration: 0.18 } }}
          >
            <Link
              to="/domains/$slug"
              params={{ slug: d.slug }}
              className="group flex h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-primary/10 bg-white shadow-sm transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.97]"
            >
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${palette.bg} transition-transform duration-200 group-hover:scale-105`}>
                <d.icon className={`h-4 w-4 ${palette.text}`} strokeWidth={1.75} />
              </span>
              <span className="w-full px-1.5 text-center text-[10.5px] font-semibold leading-tight text-gray-800">
                {d.name}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  </div>
</section>
     

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white px-5 py-12 md:py-14">
        <div className="mx-auto max-w-lg">
          <FadeUp>
            <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Success stories</p>
            <h2 className="mt-1 font-display text-xl font-bold text-gray-900 sm:text-2xl">
              Offers, not opinions.
            </h2>
          </FadeUp>

          <div className="mt-6 space-y-3">
            {testimonials.slice(0, 4).map((t, i) => (
              <FadeUp key={t.name} delay={Math.min(i * 0.06, 0.2)}>
                <figure className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-3 w-3 fill-accent text-accent" />
                    ))}
                  </div>
                  <blockquote className="mt-2 text-sm leading-relaxed text-gray-700">
                    "{t.text}"
                  </blockquote>
                  <figcaption className="mt-3 flex items-center gap-2.5 border-t border-gray-50 pt-3">
                    <div
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: t.color }}
                    >
                      {t.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-900">{t.name}</p>
                      <p className="truncate text-[10px] text-gray-400">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-gray-50 px-5 py-12 md:py-14">
        <div className="mx-auto max-w-md">
          <FadeUp>
            <div className="overflow-hidden rounded-3xl gradient-primary px-6 py-10 text-center text-primary-foreground">
              <Trophy className="mx-auto h-8 w-8 opacity-80" />
              <h2 className="mt-3 font-display text-2xl font-bold">
                Your next offer is one conversation away.
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-primary-foreground/75">
                Join 25,000+ candidates preparing with people already inside.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button asChild size="lg" variant="hero" className="w-full">
                  <Link to="/mentors">Find your mentor</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  <Link to="/signup">Create free account</Link>
                </Button>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

    </SiteLayout>
  );
}