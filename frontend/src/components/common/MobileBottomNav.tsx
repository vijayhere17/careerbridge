import { Link } from "@tanstack/react-router";
import { Home, Users, Building2, MessageSquare, LayoutDashboard, Plus } from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const items: NavItem[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/mentors", label: "Mentors", icon: Users },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/login", label: "Messages", icon: MessageSquare },
  { to: "/login", label: "Dashboard", icon: LayoutDashboard },
];

export function MobileBottomNav() {
  return (
    <>
      {/* Floating action button */}
      <Link
        to="/mentors"
        aria-label="Book a session"
        className="fixed bottom-20 right-4 z-40 grid h-14 w-14 place-items-center rounded-full gradient-primary text-primary-foreground shadow-glow transition active:scale-95 lg:hidden"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </Link>

      {/* Bottom nav */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {items.map((it) => (
            <li key={it.label}>
              <Link
                to={it.to as "/"}
                activeOptions={{ exact: !!it.exact }}
                className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition active:bg-muted"
                activeProps={{ className: "text-primary" }}
              >
                <it.icon className="h-5 w-5" />
                <span className="leading-none">{it.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
