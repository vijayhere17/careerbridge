import { Link } from "@tanstack/react-router";
import { Twitter, Linkedin, Github } from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const groups = [
  {
    title: "Platform",
    links: [
      { to: "/mentors", label: "Find Mentors" },
      { to: "/domains", label: "Domains" },
      { to: "/companies", label: "Companies" },
      { to: "/services", label: "Career Services" },
      { to: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "For Mentors",
    links: [
      { to: "/become-a-mentor", label: "Become a Mentor" },
      { to: "/pricing", label: "Earnings" },
      { to: "/about", label: "How payouts work" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/blog", label: "Blog" },
      { to: "/about", label: "Contact" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo size="md" />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Oppverse — Opportunity Universe. Learn, prepare, get referred, and get hired with mentors
              already working at top companies.
            </p>
            <div className="mt-5 flex gap-2">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" aria-label="social" className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground hover:border-foreground/30">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h4 className="text-sm font-semibold text-foreground">{g.title}</h4>
              <ul className="mt-4 space-y-2">
                {g.links.map((l, i) => (
                  <li key={i}>
                    <Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Oppverse. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-foreground">Privacy</Link>
            <Link to="/about" className="hover:text-foreground">Terms</Link>
            <Link to="/about" className="hover:text-foreground">Trust & Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
