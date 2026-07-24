import {
  Briefcase,
  GraduationCap,
  Code2,
  Users,
  UserCheck,
  Search,
  SlidersHorizontal,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Phone,
  Mail,
  MessageCircle,
  Linkedin,
  ExternalLink,
  Lock,
  X,
  ChevronRight,
  CheckCircle2,
  Clock,
  Bell,
  History,
  Heart,
  Globe,
  ArrowLeft,
  Send,
  Upload,
  DollarSign,
  Calendar,
  BadgeCheck,
  Flame,
  Eye,
  Sparkles,
  ShieldCheck,
  Check,
  Star,
  CreditCard,
  Smartphone,
  Building2,
  Share2,
} from "lucide-react";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "internships", label: "Internships", icon: GraduationCap },
  { id: "freelance", label: "Freelance Projects", icon: Code2 },
  { id: "recruiter", label: "Urgent Hiring", icon: Users },
  { id: "hr", label: "HR Consultations", icon: UserCheck },
];

type WorkType = "Remote" | "Hybrid" | "Onsite";
type ProviderType =
  | "Company HR"
  | "Recruiter"
  | "Founder"
  | "Hiring Manager"
  | "Startup Owner"
  | "Mentor"
  | "Freelance Client";
type AppStatus =
  | "Applied"
  | "Under Review"
  | "Shortlisted"
  | "Interview Scheduled"
  | "Technical Round"
  | "Manager Round"
  | "HR Round"
  | "Offer Received"
  | "Selected"
  | "Joined"
  | "Rejected";
type View = "categories" | "list" | "tracker" | "saved" | "alerts" | "unlockHistory";

interface Opportunity {
  id: string;
  category: string;
  company: string;
  logo: string;
  title: string;
  role: string;
  location: string;
  experience: string;
  salary: string;
  workType: WorkType;
  postedDate: string;
  verified: boolean;
  description: string;
  skills: string[];
  benefits: string[];
  employmentType: string;
  interviewProcess: string;
  providerName: string;
  providerType: ProviderType;
  providerVerified: boolean;
  contactPrice: number;
  phone?: string;
  email?: string;
  whatsapp?: string;
  linkedin?: string;
  applyUrl?: string;
  industry: string;
  domain: string;
  companyWebsite?: string;
}

interface RecommendedMentor {
  id: string;
  name: string;
  initials: string;
  role: string;
  company: string;
  rating: number;
  sessions: number;
  minPrice: number;
}

interface UnlockRecord {
  id: string;
  opportunityId: string;
  company: string;
  role: string;
  providerName: string;
  amount: number;
  date: string;
}

interface Application {
  id: string;
  opportunityId: string;
  company: string;
  role: string;
  status: AppStatus;
  appliedDate: string;
}

const APP_STATUSES: AppStatus[] = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Technical Round",
  "Manager Round",
  "HR Round",
  "Offer Received",
  "Selected",
  "Joined",
];

const PROVIDER_BADGES: Record<string, string> = {
  "Company HR": "Verified HR",
  Recruiter: "Verified Recruiter",
  Founder: "Verified Startup",
  "Hiring Manager": "Verified Company",
  "Startup Owner": "Verified Startup",
  Mentor: "Verified Mentor",
  "Freelance Client": "Verified Client",
};

const DEMO_OPPS: Opportunity[] = [
  {
    id: "1",
    category: "jobs",
    company: "TCS",
    logo: "TCS",
    title: "Flutter Developer",
    role: "Flutter Developer",
    location: "Ahmedabad",
    experience: "0–2 yrs",
    salary: "₹4–6 LPA",
    workType: "Onsite",
    postedDate: "2 days ago",
    verified: true,
    description:
      "We are looking for a passionate Flutter Developer to build high quality mobile applications. You will work with our product team to deliver beautiful cross-platform apps.",
    skills: ["Flutter", "Dart", "Firebase", "REST API", "Git"],
    benefits: ["Health insurance", "PF", "Annual bonus", "Learning budget"],
    employmentType: "Full Time",
    interviewProcess: "Online Test → Technical Round → HR Round",
    providerName: "Priya Sharma",
    providerType: "Company HR",
    providerVerified: true,
    contactPrice: 10,
    phone: "+91 98765 43210",
    email: "priya.sharma@tcs.com",
    whatsapp: "+91 98765 43210",
    linkedin: "https://linkedin.com/in/priyasharma",
    applyUrl: "https://tcs.com/careers",
    industry: "IT Services",
    domain: "Mobile",
    companyWebsite: "www.tcs.com",
  },
  {
    id: "2",
    category: "jobs",
    company: "Infosys",
    logo: "INF",
    title: "Backend Developer",
    role: "Backend Developer",
    location: "Pune",
    experience: "1–3 yrs",
    salary: "₹5–8 LPA",
    workType: "Hybrid",
    postedDate: "3 days ago",
    verified: true,
    description: "Join Infosys to build scalable backend systems for enterprise clients worldwide.",
    skills: ["Node.js", "PostgreSQL", "Docker", "AWS", "REST API"],
    benefits: ["ESOP", "Flexible hours", "Remote Fridays", "Gym"],
    employmentType: "Full Time",
    interviewProcess: "Resume Screen → Coding Round → System Design → HR",
    providerName: "Rahul Mehta",
    providerType: "Hiring Manager",
    providerVerified: true,
    contactPrice: 10,
    phone: "+91 97654 32109",
    email: "rahul.mehta@infosys.com",
    whatsapp: "+91 97654 32109",
    linkedin: "https://linkedin.com/in/rahulmehta",
    applyUrl: "https://infosys.com/careers",
    industry: "IT Services",
    domain: "Backend",
  },
  {
    id: "3",
    category: "jobs",
    company: "Wipro",
    logo: "WIP",
    title: "UI/UX Designer",
    role: "UI/UX Designer",
    location: "Bengaluru",
    experience: "1–2 yrs",
    salary: "₹3–5 LPA",
    workType: "Hybrid",
    postedDate: "4 days ago",
    verified: true,
    description: "Design beautiful and intuitive user interfaces for our enterprise SaaS products.",
    skills: ["Figma", "Adobe XD", "User Research", "Prototyping", "CSS"],
    benefits: ["Learning budget", "Health insurance", "Transport"],
    employmentType: "Full Time",
    interviewProcess: "Portfolio Review → Design Challenge → Cultural Fit",
    providerName: "Sneha Kapoor",
    providerType: "Company HR",
    providerVerified: true,
    contactPrice: 10,
    phone: "+91 96543 21098",
    email: "sneha.kapoor@wipro.com",
    whatsapp: "+91 96543 21098",
    linkedin: "https://linkedin.com/in/snehakapoor",
    applyUrl: "https://wipro.com/careers",
    industry: "IT Services",
    domain: "Design",
  },
  {
    id: "4",
    category: "internships",
    company: "Groww",
    logo: "GW",
    title: "Product Intern – Growth",
    role: "Product Intern",
    location: "Bengaluru",
    experience: "0–1 yr",
    salary: "₹25–40k/month",
    workType: "Hybrid",
    postedDate: "1 day ago",
    verified: true,
    description:
      "6-month product internship in Groww's Growth team. Work on A/B tests, feature discovery, and user research.",
    skills: ["Product Thinking", "SQL", "Figma", "Excel"],
    benefits: ["PPO opportunity", "Stipend", "Certificate"],
    employmentType: "Internship",
    interviewProcess: "Assignment → Product Discussion → Culture Fit",
    providerName: "Ananya Iyer",
    providerType: "Company HR",
    providerVerified: true,
    contactPrice: 10,
    phone: "+91 95432 10987",
    email: "ananya@groww.com",
    whatsapp: "+91 95432 10987",
    linkedin: "https://linkedin.com/in/ananyaiyer",
    applyUrl: "https://groww.in/careers",
    industry: "Fintech",
    domain: "Product",
  },
  {
    id: "5",
    category: "freelance",
    company: "DesignCo",
    logo: "DC",
    title: "Freelance UI/UX Designer",
    role: "UI/UX Designer",
    location: "Remote",
    experience: "2+ yrs",
    salary: "₹1.5–3L project",
    workType: "Remote",
    postedDate: "5 hours ago",
    verified: false,
    description:
      "6-week contract to redesign our SaaS dashboard. Deliverables: wireframes, prototypes, Figma system.",
    skills: ["Figma", "Prototyping", "Design Systems", "Accessibility"],
    benefits: ["Flexible timeline", "Portfolio work"],
    employmentType: "Freelance",
    interviewProcess: "Portfolio Review → 1 Call → Contract",
    providerName: "Karan Mehta",
    providerType: "Freelance Client",
    providerVerified: false,
    contactPrice: 9,
    phone: "+91 94321 09876",
    email: "karan@designco.in",
    whatsapp: "+91 94321 09876",
    linkedin: "https://linkedin.com/in/karanmehta",
    industry: "Design",
    domain: "SaaS",
  },
  {
    id: "6",
    category: "recruiter",
    company: "TalentBridge",
    logo: "TB",
    title: "Hiring for 12 Senior Engineers",
    role: "Various Engineering Roles",
    location: "Pan India",
    experience: "4–10 yrs",
    salary: "₹20–60 LPA",
    workType: "Hybrid",
    postedDate: "1 day ago",
    verified: true,
    description:
      "Actively hiring Senior Engineers for multiple funded startups and enterprise clients. Fast closures.",
    skills: ["Python", "React", "AWS", "System Design"],
    benefits: ["Quick process", "Multiple options"],
    employmentType: "Full Time",
    interviewProcess: "Profile Review → Client Intro → Interview → Offer",
    providerName: "Sneha Kapoor",
    providerType: "Recruiter",
    providerVerified: true,
    contactPrice: 19,
    phone: "+91 93210 98765",
    email: "sneha@talentbridge.hr",
    whatsapp: "+91 93210 98765",
    linkedin: "https://linkedin.com/in/snehakapoor",
    industry: "Recruitment",
    domain: "Tech",
  },
];

const DEMO_MENTORS: RecommendedMentor[] = [
  {
    id: "m1",
    name: "Rahul Sharma",
    initials: "RS",
    role: "Software Engineer",
    company: "TCS",
    rating: 4.9,
    sessions: 128,
    minPrice: 149,
  },
  {
    id: "m2",
    name: "Sneha Patel",
    initials: "SP",
    role: "Senior Developer",
    company: "TCS",
    rating: 4.8,
    sessions: 96,
    minPrice: 199,
  },
  {
    id: "m3",
    name: "Vivek Kumar",
    initials: "VK",
    role: "Team Lead",
    company: "TCS",
    rating: 4.7,
    sessions: 74,
    minPrice: 199,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Tag({ text, variant = "muted" }: { text: string; variant?: "muted" | "primary" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
        variant === "primary"
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-muted text-muted-foreground border-border"
      }`}
    >
      {text}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/20"}`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OPPORTUNITY CARD
// ─────────────────────────────────────────────────────────────────────────────

function OpportunityCard({
  opp,
  isSaved,
  onSave,
  onView,
}: {
  opp: Opportunity;
  isSaved: boolean;
  onSave: () => void;
  onView: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
          {opp.logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{opp.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {opp.company} · {opp.location}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              className="shrink-0 p-1 text-muted-foreground hover:text-primary transition-colors"
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs font-semibold text-primary">{opp.salary}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {opp.experience}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {opp.location}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {opp.skills.slice(0, 3).map((s) => (
              <Tag key={s} text={s} variant="primary" />
            ))}
            {opp.skills.length > 3 && <Tag text={`+${opp.skills.length - 3}`} />}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {opp.verified && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">{opp.postedDate}</span>
            </div>
            <button
              onClick={onView}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAILS PANEL
// ─────────────────────────────────────────────────────────────────────────────

function DetailsPanel({
  opp,
  isUnlocked,
  onClose,
  onUnlock,
  onApply,
}: {
  opp: Opportunity;
  isUnlocked: boolean;
  onClose: () => void;
  onUnlock: () => void;
  onApply: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-stretch justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative flex h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-surface lg:h-full lg:w-[460px] lg:rounded-none lg:rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <span className="font-semibold text-sm truncate pr-4">{opp.title}</span>
          <div className="flex items-center gap-1">
            <button className="rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground">
              <Share2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 p-4">
          {/* Company header */}
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                {opp.logo}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-base">{opp.title}</p>
                <p className="text-sm text-muted-foreground">{opp.company}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {opp.salary}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {opp.experience}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {opp.location}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {opp.skills.map((s) => (
                    <Tag key={s} text={s} variant="primary" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setExpanded((e) => (e === "desc" ? null : "desc"))}
              className="flex w-full items-center justify-between p-4 text-sm font-semibold hover:bg-muted/40 transition-colors"
            >
              Job Description{" "}
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === "desc" ? "rotate-90" : ""}`}
              />
            </button>
            {expanded === "desc" && (
              <div className="border-t border-border px-4 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed pt-3">
                  {opp.description}
                </p>
              </div>
            )}
          </div>

          {/* About Company */}
          <div className="rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setExpanded((e) => (e === "company" ? null : "company"))}
              className="flex w-full items-center justify-between p-4 text-sm font-semibold hover:bg-muted/40 transition-colors"
            >
              About Company{" "}
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === "company" ? "rotate-90" : ""}`}
              />
            </button>
            {expanded === "company" && (
              <div className="border-t border-border px-4 pb-4 pt-3 text-sm text-muted-foreground">
                <p>
                  {opp.company} · {opp.industry} · {opp.domain}
                </p>
                {opp.companyWebsite && (
                  <p className="mt-1 text-primary text-xs">{opp.companyWebsite}</p>
                )}
              </div>
            )}
          </div>

          {/* Requirements */}
          <div className="rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setExpanded((e) => (e === "req" ? null : "req"))}
              className="flex w-full items-center justify-between p-4 text-sm font-semibold hover:bg-muted/40 transition-colors"
            >
              Requirements{" "}
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === "req" ? "rotate-90" : ""}`}
              />
            </button>
            {expanded === "req" && (
              <div className="border-t border-border px-4 pb-4">
                <ul className="space-y-1.5 pt-3">
                  {opp.skills.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setExpanded((e) => (e === "ben" ? null : "ben"))}
              className="flex w-full items-center justify-between p-4 text-sm font-semibold hover:bg-muted/40 transition-colors"
            >
              Benefits{" "}
              <ChevronRight
                className={`h-4 w-4 text-muted-foreground transition-transform ${expanded === "ben" ? "rotate-90" : ""}`}
              />
            </button>
            {expanded === "ben" && (
              <div className="border-t border-border px-4 pb-4">
                <ul className="space-y-1.5 pt-3">
                  {opp.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 border-t border-border bg-surface p-4 flex gap-2">
          <button
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-primary py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            Apply Now
          </button>
          {!isUnlocked ? (
            <button
              onClick={onUnlock}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Lock className="h-4 w-4" /> Unlock HR Contact
            </button>
          ) : (
            <button
              onClick={onUnlock}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Phone className="h-4 w-4" /> View Contact
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT PAGE
// ─────────────────────────────────────────────────────────────────────────────

function PaymentPage({
  opp,
  onClose,
  onSuccess,
}: {
  opp: Opportunity;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [method, setMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [step, setStep] = useState<"pay" | "processing" | "success">("pay");

  const methods = [
    { id: "upi", label: "UPI", icon: Smartphone },
    { id: "card", label: "Card", icon: CreditCard },
    { id: "netbanking", label: "Net Banking", icon: Building2 },
  ] as const;

  const pay = () => {
    setStep("processing");
    setTimeout(() => setStep("success"), 1800);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 lg:items-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface shadow-xl">
        {step === "pay" && (
          <>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm">Unlock Contact Details</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-xl border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Amount to Pay</p>
                  <p className="text-2xl font-bold text-primary mt-0.5">₹{opp.contactPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{opp.title}</p>
                  <p className="text-[11px] text-muted-foreground">{opp.company}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Secure Payment
                </p>
                <div className="flex gap-2">
                  {methods.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setMethod(id as any)}
                      className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all ${method === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${method === id ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <span
                        className={`text-xs font-semibold ${method === id ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl bg-muted p-2.5">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <p className="text-[11px] text-muted-foreground">Secured by Razorpay</p>
              </div>

              <button
                onClick={pay}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Pay Now ₹{opp.contactPrice}
              </button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-14 px-6">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="font-semibold text-sm">Processing payment…</p>
            <p className="text-xs text-muted-foreground mt-1">Please do not close this window</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center text-center py-8 px-6">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>
            <h3 className="font-bold text-base">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-5">Contact Details Unlocked</p>
            <button
              onClick={onSuccess}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Contact
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT DETAILS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function ContactDetailsPage({ opp, onClose }: { opp: Opportunity; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 lg:items-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-sm">HR Contact Details</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-border p-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
              {opp.providerName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p className="font-bold text-sm">{opp.providerName}</p>
              <p className="text-xs text-muted-foreground">{opp.providerType}</p>
              <p className="text-xs text-muted-foreground">{opp.company}</p>
            </div>
          </div>

          {opp.email && (
            <a
              href={`mailto:${opp.email}`}
              className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40 transition-colors"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{opp.email}</p>
              </div>
            </a>
          )}

          {opp.phone && (
            <a
              href={`tel:${opp.phone}`}
              className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40 transition-colors"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Mobile</p>
                <p className="text-sm font-medium">{opp.phone}</p>
              </div>
            </a>
          )}

          {opp.whatsapp && (
            <a
              href={`https://wa.me/${opp.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40 transition-colors"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">WhatsApp</p>
                <p className="text-sm font-medium">Chat on WhatsApp</p>
              </div>
            </a>
          )}

          {opp.linkedin && (
            <a
              href={opp.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/40 transition-colors"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                <Linkedin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">LinkedIn</p>
                <p className="text-sm font-medium">View LinkedIn Profile</p>
              </div>
            </a>
          )}

          {opp.companyWebsite && (
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Company Website</p>
                <p className="text-sm font-medium">{opp.companyWebsite}</p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLY MODAL + SUCCESS PAGE + RECOMMENDED MENTORS
// ─────────────────────────────────────────────────────────────────────────────

function ApplyModal({
  opp,
  onClose,
  onSuccess,
}: {
  opp: Opportunity;
  onClose: () => void;
  onSuccess: (message: string, resume: string | null) => void;
}) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [resume, setResume] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const handle =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 lg:items-center p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-xl my-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-bold text-sm">Apply for {opp.title}</h3>
            <p className="text-xs text-muted-foreground">{opp.company}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            try {
              let resumePath: string | null = null;

              if (resume) {
                setUploading(true);

                const formData = new FormData();
                formData.append("resume", resume);

                const token = localStorage.getItem("cb-token");

                const uploadResponse = await fetch("http://127.0.0.1:8000/api/upload-resume", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  body: formData,
                });

                const uploadData = await uploadResponse.json();

                setUploading(false);

                if (!uploadResponse.ok) {
                  alert(uploadData.message || "Resume upload failed");
                  return;
                }

                resumePath = uploadData.resume;
              }

              onSuccess(form.message, resumePath);
            } catch (err) {
              setUploading(false);
              console.error(err);
              alert("Something went wrong.");
            }
          }}
          className="p-4 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Upload Resume *
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 hover:border-primary/40 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />

              <div className="flex-1">
                <p className="text-sm font-medium">{resume ? resume.name : "Choose Resume"}</p>

                <p className="text-[11px] text-muted-foreground">PDF, DOC, DOCX (Max 5MB)</p>
              </div>

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    setResume(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Additional Message (Optional)
            </label>
            <textarea
              value={form.message}
              onChange={handle("message")}
              rows={3}
              placeholder="Write something about yourself…"
              className="dash-input w-full resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationSuccessPage({
  opp,
  mentors,
  onClose,
  onViewApplications,
}: {
  opp: Opportunity;
  mentors: RecommendedMentor[];
  onClose: () => void;
  onViewApplications: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 lg:items-center p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-xl my-4">
        <div className="p-6 text-center border-b border-border">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 mx-auto mb-4">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <h3 className="font-bold text-lg">Application Submitted Successfully!</h3>
          <p className="text-sm text-muted-foreground mt-2">
            We have sent your application to <span className="font-semibold">{opp.company}</span>.
            You will be notified once they review your profile.
          </p>
          <button
            onClick={onViewApplications}
            className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to My Applications
          </button>
        </div>

        {mentors.length > 0 && (
          <div className="p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Recommended Mentors
            </p>
            <p className="text-[11px] text-muted-foreground -mt-1">Employees from same company</p>
            <div className="space-y-2">
              {mentors.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.role} · {m.company}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Stars rating={m.rating} />
                      <span className="text-[11px] font-semibold">{m.rating}</span>
                      <span className="text-[11px] text-muted-foreground">
                        · {m.sessions} sessions
                      </span>
                    </div>
                  </div>
                  <button className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                    Book Session
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-border py-2 text-xs font-semibold hover:bg-muted transition-colors"
            >
              View All Mentors
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTERS
// ─────────────────────────────────────────────────────────────────────────────

function FiltersPanel({ onClose }: { onClose: () => void }) {
  const [workType, setWorkType] = useState<string[]>([]);
  const [sort, setSort] = useState("Latest");

  const Chip = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">Filters</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Work Type
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Remote", "Hybrid", "Onsite"].map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={workType.includes(t)}
                  onClick={() =>
                    setWorkType((w) => (w.includes(t) ? w.filter((x) => x !== t) : [...w, t]))
                  }
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Experience
            </p>
            <div className="flex gap-2">
              <input type="text" placeholder="Min e.g. 0" className="dash-input flex-1" />
              <input type="text" placeholder="Max e.g. 5 yrs" className="dash-input flex-1" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Salary
            </p>
            <div className="flex gap-2">
              <input type="text" placeholder="Min ₹" className="dash-input flex-1" />
              <input type="text" placeholder="Max ₹" className="dash-input flex-1" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Sort by
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Latest", "Salary: High", "Salary: Low", "Most Relevant"].map((s) => (
                <Chip key={s} label={s} active={sort === s} onClick={() => setSort(s)} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION TRACKER
// ─────────────────────────────────────────────────────────────────────────────

function ApplicationTracker({ apps }: { apps: Application[] }) {
  if (!apps.length)
    return (
      <EmptyState
        icon={Briefcase}
        title="No applications yet"
        body="Apply to opportunities and track your progress here."
      />
    );
  return (
    <div className="space-y-3">
      {apps.map((app) => {
        const idx = APP_STATUSES.indexOf(app.status);
        return (
          <div key={app.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold text-sm">{app.role}</p>
                <p className="text-xs text-muted-foreground">{app.company}</p>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                {app.status}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              {APP_STATUSES.map((s, i) => (
                <div
                  key={s}
                  title={s}
                  className={`h-1.5 flex-1 min-w-[4px] rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Applied {app.appliedDate}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function OpportunitiesHub() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(DEMO_OPPS);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());

  // Modals
  const [showPayment, setShowPayment] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [showAppSuccess, setShowAppSuccess] = useState(false);

  const [applications, setApplications] = useState<Application[]>([]);
  const [unlockHistory, setUnlockHistory] = useState<UnlockRecord[]>([]);
  const [jobAlerts] = useState([
    { id: "ja1", company: "Any", role: "Frontend Engineer", location: "Remote" },
  ]);

  // API load
  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch<{ opportunities: any[] }>("/api/opportunities");
        if (data?.opportunities?.length) {
          setOpportunities(
            data.opportunities.map((item) => ({
              id: item.id,
              category: item.category,
              company: item.company,
              logo: item.company_logo ?? item.company?.slice(0, 2).toUpperCase(),
              title: item.title,
              role: item.role ?? item.title,
              location: item.location,
              experience: item.experience,
              salary: item.salary,
              workType: item.work_type ?? "Onsite",
              postedDate: "Recently",
              verified: item.verified ?? false,
              description: item.description,
              skills: item.skills ?? [],
              benefits: item.benefits ?? [],
              employmentType: item.employment_type ?? "Full Time",
              interviewProcess: item.interview_process ?? "",
              providerName: item.provider_name ?? "",
              providerType: item.provider_type ?? "Company HR",
              providerVerified: item.provider_verified ?? false,
              contactPrice: item.contact_price ?? 10,
              phone: item.contact_phone,
              email: item.contact_email,
              whatsapp: item.contact_whatsapp,
              linkedin: item.linkedin_url,
              applyUrl: item.application_url,
              industry: item.industry ?? "",
              domain: item.domain ?? "",
              companyWebsite: item.company_website,
            })),
          );
        }
        const savedData = await apiFetch<{ opportunities: any[] }>("/api/opportunities/saved");
        if (savedData?.opportunities)
          setSaved(new Set(savedData.opportunities.map((i: any) => i.id)));

        const applicationData = await apiFetch<{ applications: any[] }>(
          "/api/opportunities/applications",
        );

        setApplications(
          applicationData.applications.map((app: any) => ({
            id: app.id,
            opportunityId: app.opportunityId,
            company: app.company,
            role: app.title,
            status: app.status,
            appliedDate: new Date(app.appliedAt).toLocaleDateString(),
          })),
        );
      } catch {
        /* use demo data */
      }
    };
    load();
  }, []);

  const toggleSave = async (id: string) => {
    const wasSaved = saved.has(id);
    setSaved((prev) => {
      const n = new Set(prev);
      wasSaved ? n.delete(id) : n.add(id);
      return n;
    });
    try {
      if (wasSaved) await apiFetch(`/api/opportunities/save/${id}`, { method: "DELETE" });
      else
        await apiFetch("/api/opportunities/save", {
          method: "POST",
          body: JSON.stringify({ opportunity_id: id }),
        });
    } catch {
      setSaved((prev) => {
        const n = new Set(prev);
        wasSaved ? n.add(id) : n.delete(id);
        return n;
      });
    }
  };

  const handleUnlockSuccess = () => {
    if (!selectedOpp) return;
    setUnlocked((prev) => new Set([...prev, selectedOpp.id]));
    setShowPayment(false);
    setShowContact(true);
    setUnlockHistory((prev) => [
      {
        id: `ul${Date.now()}`,
        opportunityId: selectedOpp.id,
        company: selectedOpp.company,
        role: selectedOpp.title,
        providerName: selectedOpp.providerName,
        amount: selectedOpp.contactPrice,
        date: "Just now",
      },
      ...prev,
    ]);
  };

  const handleApplySuccess = async (message: string, resume: string | null) => {
    if (!selectedOpp) return;

    try {
      const response = await apiFetch<any>("/api/opportunities/apply", {
        method: "POST",
        body: JSON.stringify({
          opportunity_id: Number(selectedOpp.id),
          message,
          resume,
        }),
      });

      setApplications((prev) => [
        {
          id: response.application.id,
          opportunityId: response.application.opportunityId,
          company: response.application.company,
          role: response.application.title,
          status: response.application.status,
          appliedDate: "Just now",
        },
        ...prev,
      ]);

      setShowApply(false);
      setShowAppSuccess(true);
    } catch (error: any) {
      alert(error.message || "Unable to submit application.");
    }
  };

  const filteredOpps = opportunities.filter((o) => {
    const matchCat = !selectedCategory || o.category === selectedCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.title.toLowerCase().includes(q) ||
      o.company.toLowerCase().includes(q) ||
      o.role.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const savedOpps = opportunities.filter((o) => saved.has(o.id));

  const TABS = [
    { id: "list" as View, label: "Browse", icon: Search },
    { id: "tracker" as View, label: "Applications", icon: Briefcase },
    { id: "saved" as View, label: "Saved", icon: Bookmark },
    { id: "alerts" as View, label: "Alerts", icon: Bell },
    { id: "unlockHistory" as View, label: "Unlocks", icon: History },
  ];

  const viewTitle: Record<View, string> = {
    categories: "Opportunities Hub",
    list: CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? "All Opportunities",
    tracker: "My Applications",
    saved: "Saved",
    alerts: "Job Alerts",
    unlockHistory: "Unlock History",
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {view !== "categories" && (
              <button
                onClick={() => {
                  setView("categories");
                  setSelectedCategory(null);
                  setSearch("");
                }}
                className="shrink-0 rounded-lg p-1.5 hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate">{viewTitle[view]}</h2>
              {view === "list" && (
                <p className="text-[11px] text-muted-foreground">
                  {filteredOpps.length} opportunities
                </p>
              )}
            </div>
          </div>
          {view !== "categories" && (
            <div className="flex items-center gap-1 shrink-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${view === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CATEGORIES VIEW */}
      {view === "categories" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, internships, projects…"
              className="dash-input w-full pl-9"
              onFocus={() => {
                setView("list");
                setSelectedCategory(null);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Flame, label: "Trending", value: "1.2k+ active" },
              {
                icon: Sparkles,
                label: "New today",
                value: `${opportunities.filter((o) => o.postedDate.includes("hour")).length || 48} posted`,
              },
              {
                icon: ShieldCheck,
                label: "Verified",
                value: `${opportunities.filter((o) => o.verified).length || 890} verified`,
              },
              { icon: Eye, label: "Recently viewed", value: "3 by you" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-border bg-surface p-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Categories
              </p>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setView("list");
                }}
                className="text-xs text-primary font-medium hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const count = opportunities.filter((o) => o.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setView("list");
                    }}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 text-left hover:border-primary/40 transition-all group"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {cat.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{count} opportunities</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Featured Opportunities
              </p>
              <button
                onClick={() => setView("list")}
                className="text-xs text-primary font-medium hover:underline"
              >
                See All
              </button>
            </div>
            <div className="space-y-2">
              {opportunities.slice(0, 2).map((opp) => (
                <button
                  key={opp.id}
                  onClick={() => {
                    setSelectedOpp(opp);
                    setView("list");
                  }}
                  className="w-full flex items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left hover:border-primary/30 transition-colors"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {opp.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{opp.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {opp.company} · {opp.location}
                    </p>
                    <p className="text-xs font-semibold text-primary mt-0.5">
                      {opp.salary} · {opp.experience}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
              Quick Access
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jobs, companies, skills…"
                className="dash-input w-full pl-9"
              />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Filter</span>
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${selectedCategory === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {filteredOpps.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No opportunities found"
              body="Try adjusting your search or filters."
            />
          ) : (
            <div className="space-y-2">
              {filteredOpps.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opp={opp}
                  isSaved={saved.has(opp.id)}
                  onSave={() => toggleSave(opp.id)}
                  onView={() => setSelectedOpp(opp)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {view === "tracker" && <ApplicationTracker apps={applications} />}

      {view === "saved" && (
        <div className="space-y-2">
          {savedOpps.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No saved opportunities"
              body="Bookmark listings to save them here."
            />
          ) : (
            savedOpps.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                isSaved
                onSave={() => toggleSave(opp.id)}
                onView={() => setSelectedOpp(opp)}
              />
            ))
          )}
        </div>
      )}

      {view === "alerts" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Job Alerts</h3>
            <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
              + New Alert
            </button>
          </div>
          {jobAlerts.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-border p-3"
            >
              <div>
                <p className="font-semibold text-sm">{a.role}</p>
                <p className="text-xs text-muted-foreground">
                  {a.company} · {a.location}
                </p>
              </div>
              <Tag text="Active" variant="primary" />
            </div>
          ))}
        </div>
      )}

      {view === "unlockHistory" &&
        (unlockHistory.length === 0 ? (
          <EmptyState
            icon={History}
            title="No unlock history"
            body="Contacts you unlock will appear here."
          />
        ) : (
          <div className="space-y-2">
            {unlockHistory.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{r.role}</p>
                    <p className="text-xs text-muted-foreground">{r.company}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">₹{r.amount}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Tag text="Paid" variant="primary" />
                  <span className="text-[11px] text-muted-foreground">{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* DETAIL PANEL */}
      {selectedOpp && !showPayment && !showContact && !showApply && !showAppSuccess && (
        <DetailsPanel
          opp={selectedOpp}
          isUnlocked={unlocked.has(selectedOpp.id)}
          onClose={() => setSelectedOpp(null)}
          onUnlock={() =>
            unlocked.has(selectedOpp.id) ? setShowContact(true) : setShowPayment(true)
          }
          onApply={() => setShowApply(true)}
        />
      )}

      {/* PAYMENT PAGE */}
      {showPayment && selectedOpp && (
        <PaymentPage
          opp={selectedOpp}
          onClose={() => setShowPayment(false)}
          onSuccess={handleUnlockSuccess}
        />
      )}

      {/* CONTACT DETAILS PAGE */}
      {showContact && selectedOpp && (
        <ContactDetailsPage
          opp={selectedOpp}
          onClose={() => {
            setShowContact(false);
            setSelectedOpp(null);
          }}
        />
      )}

      {/* APPLY MODAL */}
      {showApply && selectedOpp && (
        <ApplyModal
          opp={selectedOpp}
          onClose={() => setShowApply(false)}
          onSuccess={handleApplySuccess}
        />
      )}

      {/* APPLICATION SUCCESS + RECOMMENDED MENTORS */}
      {showAppSuccess && selectedOpp && (
        <ApplicationSuccessPage
          opp={selectedOpp}
          mentors={DEMO_MENTORS.filter((m) => m.company === selectedOpp.company)}
          onClose={() => {
            setShowAppSuccess(false);
            setSelectedOpp(null);
          }}
          onViewApplications={() => {
            setShowAppSuccess(false);
            setSelectedOpp(null);
            setView("tracker");
          }}
        />
      )}

      {showFilters && <FiltersPanel onClose={() => setShowFilters(false)} />}
    </div>
  );
}
