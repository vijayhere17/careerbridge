import {
  Code2, Boxes, Rocket, FlaskConical, Pill, Wrench, Car, Zap, Cpu, Building2,
  HardHat, Droplet, Factory, Landmark, Banknote, Briefcase, HeartPulse,
  Megaphone, TrendingUp, Users, Truck, BarChart3, ShieldCheck, BrainCircuit,
  Cloud, GitBranch, Building, type LucideIcon,
} from "lucide-react";

export type Domain = {
  slug: string;
  name: string;
  short: string;
  icon: LucideIcon;
  tint: "primary" | "secondary" | "accent";
  companies: string[]; // company slugs
  mentorCount: number;
  popularRoles: string[];
};

export const domains: Domain[] = [
  { slug: "it-software", name: "IT & Software", short: "Product, services, and platforms", icon: Code2, tint: "primary",
    companies: ["google", "microsoft", "adobe", "infosys", "tcs", "wipro", "exotic-infotech"],
    mentorCount: 412, popularRoles: ["Software Engineer", "Full Stack Developer", "QA Engineer", "DevOps"] },
  { slug: "product-companies", name: "Product Companies", short: "FAANG and global product orgs", icon: Boxes, tint: "primary",
    companies: ["google", "meta", "amazon", "microsoft", "netflix", "uber", "adobe"],
    mentorCount: 318, popularRoles: ["SDE I/II/III", "PM", "Data Scientist", "Designer"] },
  { slug: "startups", name: "Startups", short: "Early to growth-stage rocket ships", icon: Rocket, tint: "accent",
    companies: ["flipkart", "exotic-infotech"], mentorCount: 96, popularRoles: ["Founding Engineer", "Growth", "PM"] },
  { slug: "chemical", name: "Chemical", short: "Polymers, specialty, petrochem", icon: FlaskConical, tint: "secondary",
    companies: ["reliance", "upl", "pidilite"], mentorCount: 64, popularRoles: ["Process Engineer", "R&D Chemist", "Plant Engineer"] },
  { slug: "pharmaceutical", name: "Pharmaceutical", short: "Formulations, API, and discovery", icon: Pill, tint: "secondary",
    companies: ["sun-pharma", "cipla", "dr-reddys", "zydus", "torrent-pharma"],
    mentorCount: 88, popularRoles: ["QA/QC", "Production", "Regulatory Affairs", "R&D"] },
  { slug: "mechanical", name: "Mechanical", short: "Design, manufacturing, maintenance", icon: Wrench, tint: "accent",
    companies: ["tata-motors", "mahindra", "bosch"], mentorCount: 72, popularRoles: ["Design Engineer", "Production", "Maintenance"] },
  { slug: "automobile", name: "Automobile", short: "OEMs, EV, and Tier-1 suppliers", icon: Car, tint: "primary",
    companies: ["tata-motors", "mahindra", "maruti-suzuki", "bosch"],
    mentorCount: 58, popularRoles: ["Vehicle Dynamics", "Powertrain", "BIW", "Manufacturing"] },
  { slug: "electrical", name: "Electrical", short: "Power, grid, and industrial", icon: Zap, tint: "accent",
    companies: ["bosch", "tata-motors"], mentorCount: 41, popularRoles: ["Power Systems", "PCB Design", "Controls"] },
  { slug: "electronics", name: "Electronics", short: "Semiconductors and embedded", icon: Cpu, tint: "primary",
    companies: ["bosch"], mentorCount: 47, popularRoles: ["Embedded", "VLSI", "FW Engineer"] },
  { slug: "civil", name: "Civil Engineering", short: "Structures, transport, urban", icon: Building2, tint: "secondary",
    companies: [], mentorCount: 28, popularRoles: ["Site Engineer", "Structural", "Project Manager"] },
  { slug: "construction", name: "Construction", short: "Real estate and infrastructure", icon: HardHat, tint: "accent",
    companies: [], mentorCount: 22, popularRoles: ["Planning", "QS", "Project Lead"] },
  { slug: "oil-gas", name: "Oil & Gas", short: "Upstream, midstream, downstream", icon: Droplet, tint: "secondary",
    companies: ["reliance"], mentorCount: 34, popularRoles: ["Reservoir", "Drilling", "Process"] },
  { slug: "manufacturing", name: "Manufacturing", short: "Discrete and process plants", icon: Factory, tint: "primary",
    companies: ["tata-motors", "bosch", "reliance"], mentorCount: 67, popularRoles: ["Production Manager", "Industrial Engineer"] },
  { slug: "finance", name: "Finance", short: "Investment, corporate, fintech", icon: Landmark, tint: "primary",
    companies: [], mentorCount: 89, popularRoles: ["Analyst", "Associate", "Risk", "Quant"] },
  { slug: "banking", name: "Banking", short: "Retail, corporate, treasury", icon: Banknote, tint: "secondary",
    companies: [], mentorCount: 76, popularRoles: ["RM", "Credit Analyst", "Operations"] },
  { slug: "consulting", name: "Consulting", short: "Strategy, ops, and tech advisory", icon: Briefcase, tint: "accent",
    companies: [], mentorCount: 102, popularRoles: ["Consultant", "Manager", "Engagement Lead"] },
  { slug: "healthcare", name: "Healthcare", short: "Hospitals, biotech, medtech", icon: HeartPulse, tint: "secondary",
    companies: ["cipla", "sun-pharma"], mentorCount: 54, popularRoles: ["Clinical Research", "Medical Affairs", "Biostat"] },
  { slug: "marketing", name: "Marketing", short: "Brand, performance, content", icon: Megaphone, tint: "accent",
    companies: [], mentorCount: 71, popularRoles: ["Brand Manager", "Growth", "Content Lead"] },
  { slug: "sales", name: "Sales", short: "Enterprise, SMB, and inside", icon: TrendingUp, tint: "primary",
    companies: [], mentorCount: 63, popularRoles: ["AE", "SDR", "Sales Manager"] },
  { slug: "hr", name: "HR", short: "Talent, L&D, comp & benefits", icon: Users, tint: "secondary",
    companies: [], mentorCount: 48, popularRoles: ["Recruiter", "HRBP", "L&D"] },
  { slug: "supply-chain", name: "Supply Chain", short: "Logistics, procurement, ops", icon: Truck, tint: "accent",
    companies: [], mentorCount: 39, popularRoles: ["SCM Analyst", "Logistics Manager", "Procurement"] },
  { slug: "data-analytics", name: "Data & Analytics", short: "BI, analytics engineering, DS", icon: BarChart3, tint: "primary",
    companies: ["amazon", "microsoft", "google"], mentorCount: 184, popularRoles: ["Data Analyst", "Analytics Eng", "Data Scientist"] },
  { slug: "cyber-security", name: "Cyber Security", short: "AppSec, GRC, SOC, offensive", icon: ShieldCheck, tint: "secondary",
    companies: ["microsoft", "google"], mentorCount: 57, popularRoles: ["Security Eng", "GRC", "Pentester"] },
  { slug: "ai-ml", name: "AI & Machine Learning", short: "Applied ML, research, MLOps", icon: BrainCircuit, tint: "primary",
    companies: ["google", "meta", "microsoft", "amazon"], mentorCount: 142, popularRoles: ["ML Engineer", "Applied Scientist", "MLOps"] },
  { slug: "cloud", name: "Cloud Computing", short: "AWS, Azure, GCP architecture", icon: Cloud, tint: "accent",
    companies: ["amazon", "microsoft", "google"], mentorCount: 121, popularRoles: ["Cloud Architect", "SRE", "Platform Eng"] },
  { slug: "devops", name: "DevOps", short: "CI/CD, IaC, observability", icon: GitBranch, tint: "secondary",
    companies: ["adobe", "uber"], mentorCount: 84, popularRoles: ["DevOps", "SRE", "Platform"] },
  { slug: "government", name: "Government Jobs", short: "PSUs, civil services, defence", icon: Building, tint: "primary",
    companies: [], mentorCount: 31, popularRoles: ["UPSC", "PSU Engineer", "Banking PO"] },
];

export const getDomain = (slug: string) => domains.find((d) => d.slug === slug);
