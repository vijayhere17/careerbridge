import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { BrandLogo } from "./BrandLogo";
import { getAuthToken, onAuthChange } from "@/lib/auth";

const nav = [
  { to: "/mentors", label: "Find Mentors" },
  { to: "/domains", label: "Domains" },
  { to: "/companies", label: "Companies" },
  { to: "/services", label: "Career Services" },
  { to: "/pricing", label: "Pricing" },
  { to: "/become-a-mentor", label: "Become a Mentor" },
  { to: "/about", label: "About" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const refreshAuth = () => setIsAuthenticated(Boolean(getAuthToken()));
    refreshAuth();
    return onAuthChange(refreshAuth);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <BrandLogo size="md" />

        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden lg:flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild size="sm" variant="brand">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="lg:hidden overflow-hidden border-t border-border bg-surface"
          >
            <div className="container-page flex flex-col gap-1 py-4">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  {n.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                {isAuthenticated ? (
                  <Button asChild variant="outline" size="sm" onClick={() => setOpen(false)}>
                    <Link to="/profile">Profile</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm" onClick={() => setOpen(false)}>
                    <Link to="/login">Login</Link>
                  </Button>
                )}
                {!isAuthenticated && (
                  <Button asChild size="sm" variant="brand" onClick={() => setOpen(false)}>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
