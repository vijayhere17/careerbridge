import { motion } from "framer-motion";
import { Star, Calendar, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Mentor } from "@/data/mentors";
import { Button } from "@/components/ui/button";

export function MentorCard({ mentor, index = 0 }: { mentor: Mentor; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: mentor.avatarColor }}
        >
          {mentor.initials}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <h3 className="truncate font-display text-sm font-bold text-foreground">{mentor.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{mentor.role}</p>
          <p className="truncate text-xs font-semibold text-primary">@ {mentor.company}</p>
        </div>
        {mentor.available ? (
          <span className="shrink-0 rounded-full bg-secondary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
            Open
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Waitlist
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {mentor.skills.slice(0, 3).map((s) => (
          <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 font-semibold text-foreground">
          <Star className="h-3 w-3 fill-accent text-accent" />
          {mentor.rating.toFixed(1)}
        </span>
        <span>{mentor.reviews} reviews</span>
        <span>{mentor.sessions} sessions</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div>
          <p className="text-[10px] text-muted-foreground">From</p>
          <p className="font-display text-base font-bold text-foreground">
            ${mentor.pricePerSession}
            <span className="text-[11px] font-normal text-muted-foreground">/session</span>
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0">
            <Link to="/mentors/$id" params={{ id: mentor.id }}>
              <MessageCircle className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="brand" className="h-8 px-3 text-xs">
            <Link to="/mentors/$id" params={{ id: mentor.id }}>
              <Calendar className="h-3.5 w-3.5" />
              Book
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}