import {
  Briefcase, GraduationCap, Code2, Users, UserCheck,
  Search, SlidersHorizontal, MapPin, Bookmark, BookmarkCheck,
  Phone, Mail, MessageCircle, Linkedin, ExternalLink, Lock, X, ChevronRight,
  CheckCircle2, Clock, Bell, History, Heart,
  ArrowLeft, Send, Upload, DollarSign, Calendar, BadgeCheck,
  Flame, Eye, Sparkles, ShieldCheck, Check,
} from "lucide-react";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/auth";

const CATEGORIES = [
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "internships", label: "Internships", icon: GraduationCap },
  { id: "freelance", label: "Freelance Projects", icon: Code2 },
  { id: "recruiter", label: "Recruiter Posts", icon: Users },
  { id: "hr", label: "HR Consultations", icon: UserCheck },
];

type WorkType = "Remote" | "Hybrid" | "Onsite";
type ProviderType = "Company HR" | "Recruiter" | "Founder" | "Hiring Manager" | "Startup Owner" | "Mentor" | "Freelance Client";
type AppStatus = "Applied" | "Under Review" | "Shortlisted" | "Interview Scheduled" | "Technical Round" | "Manager Round" | "HR Round" | "Offer Received" | "Selected" | "Joined" | "Rejected";

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
}

const DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    id: "1", category: "jobs",
    company: "Razorpay", logo: "RP",
    title: "Senior Full-Stack Engineer", role: "Full-Stack Developer",
    location: "Bengaluru", experience: "3–6 yrs", salary: "₹18–30 LPA",
    workType: "Hybrid", postedDate: "2 days ago", verified: true,
    description: "We are looking for a Senior Full-Stack Engineer to join our Payments Core team. You will architect and ship scalable features used by millions of merchants across India.",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Redis", "AWS"],
    benefits: ["Health insurance", "ESOP", "Flexible hours", "Learning budget", "Remote Fridays"],
    employmentType: "Full Time",
    interviewProcess: "Resume Screening → Technical Round 1 → System Design → Culture Fit → Offer",
    providerName: "Priya Sharma", providerType: "Company HR", providerVerified: true,
    contactPrice: 49,
    phone: "+91 98765 43210", email: "priya.sharma@razorpay.com",
    whatsapp: "+91 98765 43210", linkedin: "https://linkedin.com/in/priyasharma",
    applyUrl: "https://razorpay.com/careers",
    industry: "Fintech", domain: "Payments",
  },
  {
    id: "2", category: "jobs",
    company: "Zepto", logo: "ZP",
    title: "Backend Engineer – Platform", role: "Backend Developer",
    location: "Mumbai", experience: "2–5 yrs", salary: "₹15–25 LPA",
    workType: "Onsite", postedDate: "1 day ago", verified: true,
    description: "Join Zepto's Platform Engineering team and build the distributed systems that power instant 10-minute grocery delivery for millions of customers.",
    skills: ["Go", "Kafka", "Kubernetes", "MySQL", "gRPC"],
    benefits: ["ESOPs", "Food allowance", "Health + dental", "Performance bonus"],
    employmentType: "Full Time",
    interviewProcess: "Online Test → 2 Tech Rounds → System Design → HR",
    providerName: "Rahul Verma", providerType: "Hiring Manager", providerVerified: true,
    contactPrice: 49,
    phone: "+91 97654 32109", email: "rahul.verma@zepto.com",
    whatsapp: "+91 97654 32109", linkedin: "https://linkedin.com/in/rahulverma",
    applyUrl: "https://zepto.com/careers",
    industry: "Quick Commerce", domain: "Logistics",
  },
  {
    id: "3", category: "internships",
    company: "Groww", logo: "GW",
    title: "Product Intern – Growth", role: "Product Management Intern",
    location: "Bengaluru", experience: "0–1 yr", salary: "₹25–40k/month",
    workType: "Hybrid", postedDate: "3 days ago", verified: true,
    description: "6-month product internship in Groww's Growth team. Work on A/B tests, feature discovery, and user research that shapes India's fastest-growing investment platform.",
    skills: ["Product Thinking", "SQL", "Figma", "Excel", "User Research"],
    benefits: ["PPO opportunity", "Mentorship", "Stipend", "Certificate"],
    employmentType: "Internship",
    interviewProcess: "Assignment → Product Discussion → Culture Fit",
    providerName: "Ananya Iyer", providerType: "Company HR", providerVerified: true,
    contactPrice: 19,
    phone: "+91 96543 21098", email: "ananya.iyer@groww.com",
    whatsapp: "+91 96543 21098", linkedin: "https://linkedin.com/in/ananyaiyer",
    applyUrl: "https://groww.in/careers",
    industry: "Fintech", domain: "Investment",
  },
  {
    id: "4", category: "freelance",
    company: "DesignCo Studio", logo: "DC",
    title: "Freelance UI/UX Designer", role: "UI/UX Designer",
    location: "Remote", experience: "2+ yrs", salary: "₹1.5–3L project",
    workType: "Remote", postedDate: "5 hours ago", verified: false,
    description: "We need a skilled UI/UX designer to redesign our SaaS dashboard for a 6-week contract. Deliverables include wireframes, prototypes, and a Figma design system.",
    skills: ["Figma", "Prototyping", "Design Systems", "User Research", "Accessibility"],
    benefits: ["Flexible timeline", "Creative freedom", "Portfolio-worthy work"],
    employmentType: "Freelance",
    interviewProcess: "Portfolio Review → 1 Call → Contract",
    providerName: "Karan Mehta", providerType: "Freelance Client", providerVerified: false,
    contactPrice: 9,
    phone: "+91 95432 10987", email: "karan@designcostudio.in",
    whatsapp: "+91 95432 10987", linkedin: "https://linkedin.com/in/karanmehta",
    industry: "Design", domain: "SaaS",
  },
  {
    id: "5", category: "recruiter",
    company: "TalentBridge HR", logo: "TB",
    title: "Hiring for 12 Senior Engineers", role: "Various Engineering Roles",
    location: "Pan India + Remote", experience: "4–10 yrs", salary: "₹20–60 LPA",
    workType: "Hybrid", postedDate: "1 day ago", verified: true,
    description: "We are actively hiring Senior Engineers (Backend, Frontend, ML, DevOps) for multiple funded startups and enterprise clients. Multiple roles, fast closures.",
    skills: ["Python", "React", "AWS", "MLOps", "System Design"],
    benefits: ["Referral bonus", "Quick process", "Multiple options"],
    employmentType: "Full Time",
    interviewProcess: "Profile Review → Client Introduction → Interview → Offer",
    providerName: "Sneha Kapoor", providerType: "Recruiter", providerVerified: true,
    contactPrice: 19,
    phone: "+91 94321 09876", email: "sneha@talentbridge.hr",
    whatsapp: "+91 94321 09876", linkedin: "https://linkedin.com/in/snehakapoor",
    industry: "Recruitment", domain: "Tech",
  },
  {
    id: "6", category: "jobs",
    company: "CRED", logo: "CR",
    title: "Data Scientist – Credit Risk", role: "Data Scientist",
    location: "Bengaluru", experience: "2–5 yrs", salary: "₹20–35 LPA",
    workType: "Onsite", postedDate: "4 days ago", verified: true,
    description: "CRED is looking for a Data Scientist to build credit risk models that protect millions of premium users.",
    skills: ["Python", "Scikit-learn", "XGBoost", "SQL", "Statistics", "Spark"],
    benefits: ["ESOP", "Gym membership", "Team retreats", "Health insurance"],
    employmentType: "Full Time",
    interviewProcess: "Case Study → Stats Round → ML Round → Leadership → Offer",
    providerName: "Arjun Nair", providerType: "Hiring Manager", providerVerified: true,
    contactPrice: 49,
    phone: "+91 93210 98765", email: "arjun.nair@cred.club",
    whatsapp: "+91 93210 98765", linkedin: "https://linkedin.com/in/arjunnair",
    applyUrl: "https://cred.club/careers",
    industry: "Fintech", domain: "Credit",
  },
  {
    id: "7", category: "hr",
    company: "IndependentHR", logo: "IH",
    title: "HR Consultation – Startup Hiring Strategy", role: "HR Consultant",
    location: "Remote", experience: "Founder / CXO", salary: "₹5–8k/hr",
    workType: "Remote", postedDate: "6 hours ago", verified: true,
    description: "Experienced HR consultant offering strategic hiring guidance for early-stage startups.",
    skills: ["Org Design", "Compensation Planning", "HRBP", "Startup Hiring"],
    benefits: ["Flexible sessions", "Actionable playbooks", "Follow-up support"],
    employmentType: "Freelance",
    interviewProcess: "Discovery Call → Engagement",
    providerName: "Meera Pillai", providerType: "Mentor", providerVerified: true,
    contactPrice: 9,
    phone: "+91 92109 87654", email: "meera@independenthr.in",
    whatsapp: "+91 92109 87654", linkedin: "https://linkedin.com/in/meerapillai",
    industry: "HR", domain: "Consulting",
  },
  {
    id: "8", category: "jobs",
    company: "Ather Energy", logo: "AE",
    title: "Embedded Systems Engineer", role: "Embedded Engineer",
    location: "Bengaluru", experience: "3–7 yrs", salary: "₹16–28 LPA",
    workType: "Onsite", postedDate: "3 days ago", verified: true,
    description: "Build the firmware that powers next-gen electric scooters at Ather Energy.",
    skills: ["C/C++", "RTOS", "CAN Bus", "Python", "Linux", "BLE"],
    benefits: ["EV allowance", "Free charging", "ESOP", "Subsidised meals"],
    employmentType: "Full Time",
    interviewProcess: "Technical Screen → Code Test → 2 Tech Interviews → Offer",
    providerName: "Varun Singh", providerType: "Company HR", providerVerified: true,
    contactPrice: 49,
    phone: "+91 91098 76543", email: "varun.singh@atherenergy.com",
    whatsapp: "+91 91098 76543", linkedin: "https://linkedin.com/in/varunsingh",
    applyUrl: "https://atherenergy.com/careers",
    industry: "EV / Hardware", domain: "Firmware",
  },
];

const APP_STATUSES: AppStatus[] = [
  "Applied", "Under Review", "Shortlisted", "Interview Scheduled",
  "Technical Round", "Manager Round", "HR Round", "Offer Received", "Selected", "Joined",
];

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

type View = "categories" | "list" | "tracker" | "saved" | "alerts" | "unlockHistory";

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  Remote: "Remote",
  Hybrid: "Hybrid",
  Onsite: "Onsite",
};

const PROVIDER_BADGES: Record<string, string> = {
  "Company HR": "Verified HR",
  Recruiter: "Verified Recruiter",
  Founder: "Verified Startup",
  "Hiring Manager": "Verified Company",
  "Startup Owner": "Verified Startup",
  Mentor: "Verified Mentor",
  "Freelance Client": "Verified Client",
};

function Tag({ text, variant = "default" }: { text: string; variant?: "default" | "primary" | "success" | "muted" }) {
  const styles = {
    default: "bg-muted text-foreground border border-border",
    primary: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-primary/10 text-primary border border-primary/20",
    muted: "bg-muted text-muted-foreground border border-border",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${styles[variant]}`}>
      {text}
    </span>
  );
}

function PriceBadge({ price }: { price: number }) {
  const label = price <= 9 ? "Basic" : price <= 19 ? "Verified" : "Premium";
  return <Tag text={`₹${price} · ${label}`} variant="muted" />;
}

function EmptyState({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
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

function OpportunityCard({
  opp, isSaved, onSave, onView,
}: {
  opp: Opportunity; isSaved: boolean; onSave: () => void; onView: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
          {opp.logo}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold text-sm leading-snug">{opp.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{opp.company} · {opp.role}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className="shrink-0 p-1 text-muted-foreground hover:text-primary transition-colors"
              aria-label={isSaved ? "Unsave" : "Save"}
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />{opp.location}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-xs text-muted-foreground">{opp.experience}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-xs font-semibold text-primary">{opp.salary}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <Tag text={opp.workType} variant="muted" />
            {opp.verified && (
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
            <PriceBadge price={opp.contactPrice} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {opp.postedDate}
            </span>
            <button
              onClick={onView}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailsPanel({
  opp, isUnlocked, onClose, onUnlock, onApply,
}: {
  opp: Opportunity; isUnlocked: boolean; onClose: () => void; onUnlock: () => void; onApply: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-stretch justify-end bg-black/40" onClick={onClose}>
      <div
        className="relative flex h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl bg-surface lg:h-full lg:w-[460px] lg:rounded-none lg:rounded-l-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
          <span className="font-semibold text-sm truncate pr-4">{opp.title}</span>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-4">
          <div className="rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-base font-bold text-primary">
              {opp.logo}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm">{opp.company}</p>
              <p className="text-xs text-muted-foreground">{opp.industry} · {opp.domain}</p>
              <div className="mt-1.5 flex gap-1.5 flex-wrap">
                <Tag text={opp.workType} variant="muted" />
                {opp.verified && <Tag text="Verified" variant="primary" />}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: MapPin, label: "Location", value: opp.location },
              { icon: Briefcase, label: "Experience", value: opp.experience },
              { icon: DollarSign, label: "Salary", value: opp.salary },
              { icon: Calendar, label: "Type", value: opp.employmentType },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-border p-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Icon className="h-3 w-3" />{label}</p>
                <p className="text-xs font-semibold mt-1 leading-snug">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">About the role</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{opp.description}</p>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Skills required</h4>
            <div className="flex flex-wrap gap-1.5">
              {opp.skills.map((s) => (
                <Tag key={s} text={s} variant="primary" />
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Benefits</h4>
            <ul className="space-y-1.5">
              {opp.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-2">Interview process</h4>
            <p className="text-sm text-muted-foreground">{opp.interviewProcess}</p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-3">Posted by</h4>
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary shrink-0">
                {opp.providerName.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="font-semibold text-sm">{opp.providerName}</p>
                <p className="text-xs text-muted-foreground">{opp.providerType}</p>
                {opp.providerVerified && (
                  <Tag text={PROVIDER_BADGES[opp.providerType] ?? "Verified"} variant="primary" />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Contact details</h4>
              <PriceBadge price={opp.contactPrice} />
            </div>

            {isUnlocked ? (
              <div className="space-y-2">
                {opp.phone && (
                  <a href={`tel:${opp.phone}`} className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-sm font-medium hover:bg-muted transition-colors">
                    <Phone className="h-4 w-4 text-primary shrink-0" /> {opp.phone}
                  </a>
                )}
                {opp.email && (
                  <a href={`mailto:${opp.email}`} className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-sm font-medium hover:bg-muted transition-colors">
                    <Mail className="h-4 w-4 text-primary shrink-0" /> {opp.email}
                  </a>
                )}
                {opp.whatsapp && (
                  <a href={`https://wa.me/${opp.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-sm font-medium hover:bg-muted transition-colors">
                    <MessageCircle className="h-4 w-4 text-primary shrink-0" /> WhatsApp
                  </a>
                )}
                {opp.linkedin && (
                  <a href={opp.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-sm font-medium hover:bg-muted transition-colors">
                    <Linkedin className="h-4 w-4 text-primary shrink-0" /> LinkedIn Profile
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {["Phone number", "Email address", "WhatsApp", "LinkedIn"].map((f) => (
                  <div key={f} className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <span className="text-sm text-muted-foreground">{f}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Locked</span>
                  </div>
                ))}
                <p className="mt-2 text-center text-xs text-muted-foreground">Unlock to connect directly with this provider</p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center pb-2">
            Posted {opp.postedDate} · {opp.verified ? "Verified listing" : "Unverified listing"}
          </p>
        </div>

        <div className="sticky bottom-0 border-t border-border bg-surface p-4 flex gap-2">
          {isUnlocked ? (
            opp.applyUrl ? (
              <a
                href={opp.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> Apply Now
              </a>
            ) : (
              <button
                onClick={onApply}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Send className="h-4 w-4" /> Apply Now
              </button>
            )
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold hover:bg-muted transition-colors"
              >
                Not Interested
              </button>
              <button
                onClick={onUnlock}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="h-4 w-4" /> Unlock · ₹{opp.contactPrice}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UnlockModal({ opp, onClose, onSuccess }: { opp: Opportunity; onClose: () => void; onSuccess: () => void; }) {
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");

  const handlePay = () => {
    setStep("processing");
    setTimeout(() => setStep("success"), 1600);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 lg:items-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl">
        {step === "confirm" && (
          <>
            <div className="text-center mb-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 mx-auto mb-3">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-base">Unlock Contact Details</h3>
              <p className="text-xs text-muted-foreground mt-1">{opp.title} at {opp.company}</p>
            </div>

            <div className="rounded-xl bg-muted p-3 space-y-2 mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">What you'll unlock</p>
              {["Phone Number", "Email Address", "WhatsApp", "LinkedIn Profile", "Direct Application Link"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> {item}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4 rounded-xl border border-border p-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">₹{opp.contactPrice}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handlePay} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Pay ₹{opp.contactPrice}
              </button>
            </div>
          </>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="h-9 w-9 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="font-semibold text-sm">Processing payment…</p>
            <p className="text-xs text-muted-foreground mt-1">Please wait</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 mx-auto mb-3">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-bold text-base">Contact Unlocked</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              You can now contact {opp.providerName} directly.
            </p>
            <button
              onClick={onSuccess}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Contact Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ApplyModal({ opp, onClose, onSubmit }: { opp: Opportunity; onClose: () => void; onSubmit: () => void; }) {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", currentCompany: "", currentRole: "",
    experience: "", expectedSalary: "", noticePeriod: "", portfolio: "", linkedin: "", coverLetter: "",
  });

  const handle = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const Field = ({ label, k, type = "text", placeholder = "" }: { label: string; k: keyof typeof form; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input type={type} value={form[k]} onChange={handle(k)} placeholder={placeholder} className="dash-input w-full" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 lg:items-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-xl my-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-bold text-sm">Apply — {opp.title}</h3>
            <p className="text-xs text-muted-foreground">{opp.company}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full Name *" k="fullName" placeholder="Rahul Sharma" />
            <Field label="Email *" k="email" type="email" placeholder="rahul@email.com" />
            <Field label="Phone *" k="phone" placeholder="+91 98765 43210" />
            <Field label="Current Company" k="currentCompany" placeholder="Previous Company" />
            <Field label="Current Role" k="currentRole" placeholder="Software Engineer" />
            <Field label="Experience" k="experience" placeholder="3 years" />
            <Field label="Expected Salary" k="expectedSalary" placeholder="₹20 LPA" />
            <Field label="Notice Period" k="noticePeriod" placeholder="30 days" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Resume</label>
            <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary/40 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload PDF / DOC (Max 5MB)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Portfolio" k="portfolio" placeholder="https://portfolio.me" />
            <Field label="LinkedIn URL" k="linkedin" placeholder="https://linkedin.com/in/..." />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Cover Letter</label>
            <textarea
              value={form.coverLetter}
              onChange={handle("coverLetter")}
              rows={3}
              placeholder="Why are you a great fit for this role?"
              className="dash-input w-full resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <Send className="h-4 w-4" /> Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationTracker({ apps }: { apps: Application[] }) {
  const statusColors: Record<AppStatus, string> = {
    Applied: "bg-muted text-foreground",
    "Under Review": "bg-primary/10 text-primary",
    Shortlisted: "bg-primary/10 text-primary",
    "Interview Scheduled": "bg-primary/10 text-primary",
    "Technical Round": "bg-primary/10 text-primary",
    "Manager Round": "bg-primary/10 text-primary",
    "HR Round": "bg-primary/10 text-primary",
    "Offer Received": "bg-primary/10 text-primary",
    Selected: "bg-primary/10 text-primary",
    Joined: "bg-primary/10 text-primary",
    Rejected: "bg-muted text-muted-foreground",
  };

  if (!apps.length) return <EmptyState icon={Briefcase} title="No applications yet" body="Apply to opportunities and track your progress here." />;

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
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${statusColors[app.status]}`}>
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

function JobAlerts({ alerts, onAdd }: { alerts: { id: string; company: string; role: string; location: string }[]; onAdd: () => void; }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Job Alerts</h3>
        <button onClick={onAdd} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
          + New Alert
        </button>
      </div>
      {alerts.length === 0
        ? <EmptyState icon={Bell} title="No alerts set" body="Get notified when matching opportunities are posted." />
        : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="font-semibold text-sm">{a.role}</p>
                  <p className="text-xs text-muted-foreground">{a.company || "Any company"} · {a.location || "Any location"}</p>
                </div>
                <Tag text="Active" variant="primary" />
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

function UnlockHistory({ records }: { records: UnlockRecord[]; }) {
  if (!records.length) return <EmptyState icon={History} title="No unlock history" body="Contacts you unlock will appear here." />;

  return (
    <div className="space-y-2">
      {records.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{r.role}</p>
              <p className="text-xs text-muted-foreground">{r.company} · {r.providerName}</p>
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
  );
}

function FiltersPanel({ onClose }: { onClose: () => void; }) {
  const [workType, setWorkType] = useState<string[]>([]);
  const [jobType, setJobType] = useState<string[]>([]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"}`}
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
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Work type</p>
            <div className="flex flex-wrap gap-1.5">
              {["Remote", "Hybrid", "Onsite"].map((t) => (
                <Chip key={t} label={t} active={workType.includes(t)} onClick={() => toggle(workType, setWorkType, t)} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Job type</p>
            <div className="flex flex-wrap gap-1.5">
              {["Full Time", "Part Time", "Internship", "Freelance"].map((t) => (
                <Chip key={t} label={t} active={jobType.includes(t)} onClick={() => toggle(jobType, setJobType, t)} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Salary range</p>
            <div className="flex gap-2">
              <input type="text" placeholder="Min e.g. ₹5L" className="dash-input flex-1" />
              <input type="text" placeholder="Max e.g. ₹30L" className="dash-input flex-1" />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Experience</p>
            <input type="text" placeholder="e.g. 2–5 years" className="dash-input w-full" />
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sort by</p>
            <select className="dash-input w-full">
              <option>Latest</option>
              <option>Salary: High to Low</option>
              <option>Salary: Low to High</option>
              <option>Most Relevant</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted transition-colors">
            Reset
          </button>
          <button onClick={onClose} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export function OpportunitiesHub() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("categories");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applications, setApplications] = useState<Application[]>([
    { id: "a1", opportunityId: "3", company: "Groww", role: "Product Intern – Growth", status: "Shortlisted", appliedDate: "3 days ago" },
  ]);
  const [unlockHistory, setUnlockHistory] = useState<UnlockRecord[]>([]);
  const [jobAlerts] = useState([
    { id: "ja1", company: "Any", role: "Frontend Engineer", location: "Remote" },
  ]);

  const filteredOpps = opportunities.filter((o) => {
    const matchCat = !selectedCategory || o.category === selectedCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || o.title.toLowerCase().includes(q) || o.company.toLowerCase().includes(q) || o.role.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const toggleSave = async (id: string) => {
  try {
    if (saved.has(id)) {
      await apiFetch(`/api/opportunities/save/${id}`, {
        method: "DELETE",
      });

      setSaved((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      await apiFetch("/api/opportunities/save", {
        method: "POST",
        body: JSON.stringify({
          opportunity_id: id,
        }),
      });

      setSaved((prev) => new Set([...prev, id]));
    }
  } catch (err) {
    console.error(err);
  }
};

  const handleUnlockSuccess = () => {
    if (!selectedOpp) return;
    setUnlocked((prev) => new Set([...prev, selectedOpp.id]));
    setShowUnlockModal(false);
    setUnlockHistory((prev) => [{
      id: `ul${Date.now()}`,
      opportunityId: selectedOpp.id,
      company: selectedOpp.company,
      role: selectedOpp.title,
      providerName: selectedOpp.providerName,
      amount: selectedOpp.contactPrice,
      date: "Just now",
    }, ...prev]);
  };

  const handleApplySubmit = () => {
    if (!selectedOpp) return;
    setApplications((prev) => [{
      id: `app${Date.now()}`,
      opportunityId: selectedOpp.id,
      company: selectedOpp.company,
      role: selectedOpp.title,
      status: "Applied",
      appliedDate: "Just now",
    }, ...prev]);
    setShowApplyModal(false);
    setSelectedOpp(null);
  };

  const goBack = () => { setView("categories"); setSelectedCategory(null); setSearch(""); };
  const selectCategory = (id: string) => { setSelectedCategory(id); setView("list"); };
  const savedOpps = opportunities.filter((o) => saved.has(o.id));

  const TABS: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "list", label: "Browse", icon: Search },
    { id: "tracker", label: "Applications", icon: Briefcase },
    { id: "saved", label: "Saved", icon: Bookmark },
    { id: "alerts", label: "Alerts", icon: Bell },
    { id: "unlockHistory", label: "Unlocks", icon: History },
  ];

  const viewTitle: Record<View, string> = {
    categories: "Opportunities Hub",
    list: CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? "All Opportunities",
    tracker: "Application Tracker",
    saved: "Saved",
    alerts: "Job Alerts",
    unlockHistory: "Unlock History",
  };

useEffect(() => {
  const loadOpportunities = async () => {
    try {
      // Load Opportunities
      const data = await apiFetch<{ opportunities: any[] }>("/api/opportunities");

      setOpportunities(
        data.opportunities.map((item) => ({
          id: item.id,
          category: item.category,

          company: item.company,
          logo: item.companyLogo,

          title: item.title,
          role: item.role,

          location: item.location,
          experience: item.experience,
          salary: item.salary,

          workType: item.workType,
          postedDate: "Recently",

          verified: item.verified,

          description: item.description,

          skills: item.skills,
          benefits: item.benefits,

          employmentType: item.employmentType,
          interviewProcess: "",

          providerName: item.provider.name,
          providerType: item.provider.type,
          providerVerified: item.provider.verified,

          contactPrice: item.contactPrice,

          phone: item.phone,
          email: item.email,
          whatsapp: item.whatsapp,
          linkedin: item.linkedin,
          applyUrl: item.applyUrl,

          industry: item.industry,
          domain: item.domain,
        }))
      );

      // Load Saved Opportunities
      const savedData = await apiFetch<{ opportunities: any[] }>(
        "/api/opportunities/saved"
      );

      setSaved(
        new Set(savedData.opportunities.map((item) => item.id))
      );

    } catch (error) {
      console.error("Failed to load opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  loadOpportunities();
}, []);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {view !== "categories" && (
              <button onClick={goBack} className="shrink-0 rounded-lg p-1.5 hover:bg-muted transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-sm truncate">{viewTitle[view]}</h2>
              {view === "list" && (
                <p className="text-[11px] text-muted-foreground">{filteredOpps.length} opportunities</p>
              )}
            </div>
          </div>

          {view !== "categories" && (
            <div className="flex items-center gap-1 shrink-0">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setView(tab.id)}
                    className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${view === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {view === "categories" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Flame, label: "Trending", value: "1.2k+ active" },
              { icon: Sparkles, label: "New today", value: "48 posted" },
              { icon: ShieldCheck, label: "Verified", value: "890 verified" },
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
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Categories</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const count = opportunities.filter((o) => o.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => selectCategory(cat.id)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 text-left hover:border-primary/40 hover:bg-muted/40 transition-all group"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{cat.label}</p>
                      <p className="text-[11px] text-muted-foreground">{count} opportunities</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
              <button
                onClick={() => { setSelectedCategory(null); setView("list"); }}
                className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface p-3.5 text-left hover:border-primary/40 transition-all"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Browse All</p>
                  <p className="text-[11px] text-muted-foreground">{opportunities.length} total</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Quick access</p>
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setView(tab.id)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles, companies, skills…"
                className="dash-input w-full pl-9"
              />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Filters</span>
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
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

          {filteredOpps.length === 0
            ? <EmptyState icon={Search} title="No opportunities found" body="Try adjusting your search or filters." />
            : (
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
          {savedOpps.length === 0
            ? <EmptyState icon={Heart} title="No saved opportunities" body="Tap the bookmark icon on any listing to save it here." />
            : savedOpps.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                isSaved
                onSave={() => toggleSave(opp.id)}
                onView={() => setSelectedOpp(opp)}
              />
            ))}
        </div>
      )}

      {view === "alerts" && <JobAlerts alerts={jobAlerts} onAdd={() => {}} />}
      {view === "unlockHistory" && <UnlockHistory records={unlockHistory} />}

      {selectedOpp && (
        <DetailsPanel
          opp={selectedOpp}
          isUnlocked={unlocked.has(selectedOpp.id)}
          onClose={() => setSelectedOpp(null)}
          onUnlock={() => setShowUnlockModal(true)}
          onApply={() => setShowApplyModal(true)}
        />
      )}

      {showUnlockModal && selectedOpp && (
        <UnlockModal
          opp={selectedOpp}
          onClose={() => setShowUnlockModal(false)}
          onSuccess={handleUnlockSuccess}
        />
      )}

      {showApplyModal && selectedOpp && (
        <ApplyModal
          opp={selectedOpp}
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleApplySubmit}
        />
      )}

      {showFilters && <FiltersPanel onClose={() => setShowFilters(false)} />}
    </div>
  );
}