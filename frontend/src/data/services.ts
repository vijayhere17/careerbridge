import {
  FileText, Sparkles, Linkedin, Map, Mic, MessageSquare, Code2, Layers,
  Building2, Handshake, CalendarClock, DollarSign, Repeat, Briefcase, BookOpenCheck,
} from "lucide-react";
import type { ComponentType } from "react";

export type Service = {
  slug: string;
  title: string;
  short: string;
  description: string;
  startsAt: number;
  duration: string;
  icon: ComponentType<{ className?: string }>;
  tone: "primary" | "secondary" | "accent";
};

export const services: Service[] = [
  { slug: "resume-review", title: "Resume Review", short: "Get senior eyes on every line.", description: "A working professional reviews your resume against the exact rubric their company uses.", startsAt: 29, duration: "30 min", icon: FileText, tone: "primary" },
  { slug: "ats-optimization", title: "ATS Resume Optimization", short: "Beat the bots, then the humans.", description: "Keyword mapping, formatting fixes, and ATS scoring against the JDs you target.", startsAt: 35, duration: "45 min", icon: Sparkles, tone: "secondary" },
  { slug: "linkedin-review", title: "LinkedIn Profile Review", short: "Make recruiters reach out to you.", description: "Headline, About, experience, and search optimization from someone hiring on LinkedIn weekly.", startsAt: 29, duration: "30 min", icon: Linkedin, tone: "primary" },
  { slug: "career-roadmap", title: "Career Roadmap Planning", short: "A 12-month plan, not a pep talk.", description: "Map your next role, skills gap, and milestones with a senior mentor in your domain.", startsAt: 59, duration: "60 min", icon: Map, tone: "accent" },
  { slug: "mock-interview", title: "Mock Interviews", short: "Real loop. Real feedback.", description: "Coding, design, behavioral — pressure-tested by people who interview at the company you want.", startsAt: 49, duration: "60 min", icon: Mic, tone: "primary" },
  { slug: "behavioral", title: "Behavioral Interview Prep", short: "STAR stories that actually land.", description: "Rewrite your stories with someone trained on Amazon LPs, Googleyness, or Meta values.", startsAt: 49, duration: "60 min", icon: MessageSquare, tone: "secondary" },
  { slug: "dsa", title: "DSA Preparation", short: "Patterns, not 500 problems.", description: "Topic-by-topic plans, live problem solving, and weekly checkpoints.", startsAt: 39, duration: "60 min", icon: Code2, tone: "primary" },
  { slug: "system-design", title: "System Design Prep", short: "Whiteboard with a Staff engineer.", description: "Trade-offs, scaling, depth — calibrated to L5/L6 bars.", startsAt: 79, duration: "75 min", icon: Layers, tone: "secondary" },
  { slug: "company-specific", title: "Company-Specific Prep", short: "Decode the loop.", description: "Tailored prep for Google, Meta, Amazon, Stripe — exactly as it is today.", startsAt: 69, duration: "60 min", icon: Building2, tone: "accent" },
  { slug: "referral", title: "Referral Guidance", short: "Earned, not asked.", description: "A working professional reviews your fit and refers you when you're ready.", startsAt: 99, duration: "45 min", icon: Handshake, tone: "accent" },
  { slug: "interview-scheduling", title: "Interview Scheduling Help", short: "Don't fumble the loop.", description: "How to negotiate timing, reschedules, and parallel processes professionally.", startsAt: 29, duration: "30 min", icon: CalendarClock, tone: "primary" },
  { slug: "salary-negotiation", title: "Salary Negotiation", short: "Leave nothing on the table.", description: "Levels.fyi-backed strategy, scripts, and counter-offer playbooks.", startsAt: 89, duration: "45 min", icon: DollarSign, tone: "secondary" },
  { slug: "job-switching", title: "Job Switching Strategy", short: "Switch with leverage.", description: "Timing, story, multiple offers, and burning fewer bridges.", startsAt: 69, duration: "60 min", icon: Repeat, tone: "primary" },
  { slug: "portfolio", title: "Portfolio Review", short: "For designers, PMs, and engineers.", description: "Craft a portfolio that closes the role you actually want.", startsAt: 49, duration: "45 min", icon: Briefcase, tone: "accent" },
  { slug: "study-plan", title: "Personalized Study Plan", short: "Stop drifting through prep.", description: "8-week structured plan with weekly reviews and accountability.", startsAt: 79, duration: "60 min", icon: BookOpenCheck, tone: "secondary" },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
