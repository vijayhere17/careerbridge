import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Users } from "lucide-react";
import type { Company } from "@/data/companies";

export function CompanyCard({ company, index = 0 }: { company: Company; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to="/companies/$slug"
        params={{ slug: company.slug }}
        className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
      >
        <div className="flex items-start justify-between">
          <div
            className={
              company.logoUrl
                ? "grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-sm"
                : "grid h-14 w-14 place-items-center rounded-2xl text-xl font-black text-white"
            }
            style={company.logoUrl ? undefined : { backgroundColor: company.color }}
          >
           {company.logoUrl ? (
  <img
    src={company.logoUrl}
    alt={`${company.name} logo`}
    className="h-8 w-8 object-contain rounded-md"
    onError={(e) => {
      const target = e.currentTarget;
      target.style.display = "none";
      target.parentElement!.innerHTML = `<span class="text-xl font-black" style="color:${company.color}">${company.logo}</span>`;
    }}
  />
) : (
  company.logo
)}
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
        <h3 className="mt-4 font-display text-lg font-bold text-foreground">{company.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{company.industry}</p>
        <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Users className="h-3.5 w-3.5" />
          {company.mentors} mentors
        </div>
      </Link>
    </motion.div>
  );
}
