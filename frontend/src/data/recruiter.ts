// Mock data for the Recruiter (Opportunity Provider) panel.
// Structured to make future Laravel API integration straightforward.

export const recruiterProfile = {
  name: "Ananya Verma",
  designation: "Senior Talent Acquisition Manager",
  company: "Exotic Infotech Pvt Ltd",
  industry: "IT Services & Consulting",
  location: "Pune, Maharashtra, IN",
  email: "ananya@exoticinfotech.com",
  phone: "+91 98765 43210",
  website: "https://exoticinfotech.com",
  linkedin: "https://linkedin.com/in/ananya-verma",
  verified: true,
  avatar: "https://i.pravatar.cc/160?img=47",
  logo: "E",
  logoColor: "#7C3AED",
  hiringFor: ["Full-Stack Engineers", "SDET", "Product Designers", "DevOps"],
  openPositions: 14,
  description:
    "Fast-growing product studio building SaaS for fintech and supply chain. We hire people who love ownership and craft.",
};

export const recruiterStats = {
  activePosts: 14,
  applications: 328,
  todayUnlockEarnings: 1240,
  walletBalance: 48750,
  totalUnlocks: 812,
  monthEarnings: 26400,
  lifetimeEarnings: 184320,
  pending: 3200,
  withdrawn: 132170,
};

export type OpportunityType = "Job" | "Internship" | "Freelance" | "Urgent";
export type PostStatus = "Published" | "Draft" | "Paused" | "Closed";

export type Post = {
  id: string;
  title: string;
  type: OpportunityType;
  status: PostStatus;
  applications: number;
  unlocks: number;
  views: number;
  posted: string;
  location: string;
  mode: "Remote" | "Hybrid" | "Office";
};

export const posts: Post[] = [
  { id: "p_001", title: "Senior React Engineer", type: "Job", status: "Published", applications: 62, unlocks: 41, views: 1284, posted: "2026-06-18", location: "Pune, IN", mode: "Hybrid" },
  { id: "p_002", title: "Product Design Intern", type: "Internship", status: "Published", applications: 143, unlocks: 88, views: 2210, posted: "2026-06-21", location: "Remote", mode: "Remote" },
  { id: "p_003", title: "DevOps Lead (Urgent)", type: "Urgent", status: "Published", applications: 27, unlocks: 19, views: 640, posted: "2026-06-26", location: "Bengaluru, IN", mode: "Office" },
  { id: "p_004", title: "Freelance – Next.js SaaS", type: "Freelance", status: "Draft", applications: 0, unlocks: 0, views: 0, posted: "2026-06-30", location: "Remote", mode: "Remote" },
  { id: "p_005", title: "Backend Engineer (Node)", type: "Job", status: "Paused", applications: 34, unlocks: 12, views: 502, posted: "2026-05-30", location: "Pune, IN", mode: "Hybrid" },
  { id: "p_006", title: "QA Automation Engineer", type: "Job", status: "Published", applications: 41, unlocks: 22, views: 812, posted: "2026-06-14", location: "Remote", mode: "Remote" },
  { id: "p_007", title: "Growth Marketing Intern", type: "Internship", status: "Closed", applications: 21, unlocks: 8, views: 315, posted: "2026-04-11", location: "Pune, IN", mode: "Office" },
];

export type Application = {
  id: string;
  name: string;
  role: string;
  experience: string;
  skills: string[];
  photo: string;
  applied: string;
  status: "New" | "Shortlisted" | "Interview" | "Rejected";
  resume: string;
  post: string;
};

export const applications: Application[] = [
  { id: "a1", name: "Rahul Sharma", role: "Senior React Engineer", experience: "6 yrs", skills: ["React", "TypeScript", "Node"], photo: "https://i.pravatar.cc/120?img=12", applied: "2026-06-29", status: "New", resume: "#", post: "Senior React Engineer" },
  { id: "a2", name: "Priya Nair", role: "Product Design Intern", experience: "0-1 yrs", skills: ["Figma", "UX Research"], photo: "https://i.pravatar.cc/120?img=32", applied: "2026-06-28", status: "Shortlisted", resume: "#", post: "Product Design Intern" },
  { id: "a3", name: "Arjun Mehta", role: "DevOps Lead", experience: "8 yrs", skills: ["AWS", "K8s", "Terraform"], photo: "https://i.pravatar.cc/120?img=15", applied: "2026-06-27", status: "Interview", resume: "#", post: "DevOps Lead (Urgent)" },
  { id: "a4", name: "Sneha Iyer", role: "Backend Engineer", experience: "3 yrs", skills: ["Node", "Postgres"], photo: "https://i.pravatar.cc/120?img=45", applied: "2026-06-26", status: "New", resume: "#", post: "Backend Engineer (Node)" },
  { id: "a5", name: "Vikram Singh", role: "QA Automation", experience: "4 yrs", skills: ["Playwright", "TS"], photo: "https://i.pravatar.cc/120?img=68", applied: "2026-06-25", status: "Rejected", resume: "#", post: "QA Automation Engineer" },
  { id: "a6", name: "Ishita Roy", role: "Senior React Engineer", experience: "5 yrs", skills: ["React", "Redux", "GraphQL"], photo: "https://i.pravatar.cc/120?img=25", applied: "2026-06-24", status: "Shortlisted", resume: "#", post: "Senior React Engineer" },
];

export const unlockTx = [
  { id: "u1", candidate: "Rahul Sharma", opportunity: "Senior React Engineer", amount: 49, date: "2026-06-30 10:22", status: "Success" },
  { id: "u2", candidate: "Priya Nair", opportunity: "Product Design Intern", amount: 29, date: "2026-06-30 09:44", status: "Success" },
  { id: "u3", candidate: "Arjun Mehta", opportunity: "DevOps Lead (Urgent)", amount: 79, date: "2026-06-29 18:03", status: "Success" },
  { id: "u4", candidate: "Sneha Iyer", opportunity: "Backend Engineer (Node)", amount: 49, date: "2026-06-29 15:11", status: "Success" },
  { id: "u5", candidate: "Vikram Singh", opportunity: "QA Automation Engineer", amount: 39, date: "2026-06-28 12:40", status: "Refunded" },
  { id: "u6", candidate: "Ishita Roy", opportunity: "Senior React Engineer", amount: 49, date: "2026-06-28 11:05", status: "Success" },
];

export const withdrawHistory = [
  { id: "w1", amount: 25000, method: "HDFC ••4321", date: "2026-06-15", status: "Completed" },
  { id: "w2", amount: 18000, method: "HDFC ••4321", date: "2026-05-20", status: "Completed" },
  { id: "w3", amount: 12000, method: "ICICI ••8890", date: "2026-04-14", status: "Completed" },
  { id: "w4", amount: 8000, method: "HDFC ••4321", date: "2026-06-28", status: "Pending" },
];

export const notifications = [
  { id: "n1", type: "Application", title: "New application received", body: "Rahul Sharma applied for Senior React Engineer.", time: "10 min ago", read: false },
  { id: "n2", type: "Payment", title: "Contact unlocked", body: "You earned ₹49 from Priya Nair.", time: "1 hr ago", read: false },
  { id: "n3", type: "Booking", title: "Interview confirmed", body: "Arjun Mehta confirmed the interview slot on Jul 3, 4:00 PM.", time: "3 hrs ago", read: false },
  { id: "n4", type: "System", title: "Post published", body: "‘DevOps Lead (Urgent)’ is live to 240k+ candidates.", time: "Yesterday", read: true },
  { id: "n5", type: "Payment", title: "Withdrawal processed", body: "₹25,000 credited to HDFC ••4321.", time: "2 days ago", read: true },
  { id: "n6", type: "System", title: "Verification approved", body: "Your company profile is now verified.", time: "Last week", read: true },
];

export const earningsChart = [
  { day: "Mon", amount: 820 },
  { day: "Tue", amount: 1240 },
  { day: "Wed", amount: 980 },
  { day: "Thu", amount: 1590 },
  { day: "Fri", amount: 2140 },
  { day: "Sat", amount: 720 },
  { day: "Sun", amount: 1240 },
];
