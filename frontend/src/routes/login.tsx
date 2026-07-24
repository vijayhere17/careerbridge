import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Compass,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  UsersRound,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, setAuth, type AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function getRoleLabel(role: AuthUser["role"]): string {
  switch (role) {
    case "seeker":
      return "Candidate";
    case "mentor":
      return "Mentor";
    case "opportunity_provider":
      return "Opportunity Provider";
    case "hr":
      return "HR Professional";
    case "admin":
      return "Admin";
    default:
      return "User";
  }
}

function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await apiFetch<{ user: AuthUser; api_token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });
      setAuth(res.user, res.api_token);
      const redirectTo =
        res.user.role === "hr"
          ? "/hr"
          : res.user.role === "opportunity_provider"
            ? "/recruiter"
            : "/dashboard";
      router.navigate({ to: redirectTo });
    } catch (err: any) {
      setError(err?.message ?? "Invalid credentials. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const ROLE_CARDS = [
    { icon: GraduationCap, label: "Candidate", desc: "Find mentors & jobs" },
    { icon: UsersRound, label: "Mentor", desc: "Guide & earn" },
    { icon: Briefcase, label: "Opportunity Provider", desc: "Post & hire" },
    { icon: ShieldCheck, label: "Admin", desc: "Manage platform" },
  ];

  return (
    <AuthShell>
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* ── Left panel — branding ── */}
        <div className="hidden lg:flex flex-col justify-between bg-primary p-10 text-primary-foreground">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20">
                <Compass className="h-5 w-5" />
              </span>
              CareerBridge
            </Link>
            <p className="mt-2 text-sm text-primary-foreground/70">
              Talk to Real Employees. Get Career Ready.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-3xl font-bold leading-snug">
              One platform.
              <br />
              Every career goal.
            </h2>
            <p className="text-sm text-primary-foreground/80 leading-relaxed max-w-xs">
              Connect with mentors, discover opportunities, and accelerate your career — all in one
              place.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {ROLE_CARDS.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4">
                  <Icon className="h-5 w-5 mb-2" />
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-primary-foreground/70">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-primary-foreground/50">
            © 2025 CareerBridge. All rights reserved.
          </p>
        </div>

        {/* ── Right panel — form ── */}
        <div className="flex flex-col min-h-screen bg-background">
          {/* Mobile header */}
          <div className="flex items-center justify-between p-5 lg:hidden border-b border-border">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-display text-base font-bold"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
                <Compass className="h-4 w-4" />
              </span>
              Career<span className="text-primary">Bridge</span>
            </Link>
            <Link to="/signup" className="text-sm font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 py-10">
            <div className="w-full max-w-sm">
              <div className="mb-8">
                <h1 className="font-display text-2xl font-bold">Welcome back</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to access your dashboard
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <AuthField label="Email or Mobile Number" icon={Mail}>
                  <input
                    required
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="you@example.com or 9876543210"
                    className="auth-input"
                    autoComplete="username"
                  />
                </AuthField>

                <div>
                  <AuthField label="Password" icon={Lock}>
                    <input
                      required
                      type={showPass ? "text" : "password"}
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="auth-input"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </AuthField>
                  <div className="mt-2 text-right">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? (
                    "Signing in…"
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign in <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  New to CareerBridge?{" "}
                  <Link to="/signup" className="font-semibold text-primary hover:underline">
                    Create an account
                  </Link>
                </p>
              </div>

              {/* Role hint cards — mobile only */}
              <div className="mt-8 lg:hidden">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center mb-3">
                  One login for all roles
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_CARDS.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="rounded-xl border border-border p-3">
                      <Icon className="h-4 w-4 text-primary mb-1.5" />
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-6 text-center text-[11px] text-muted-foreground">
                By signing in you agree to our{" "}
                <a href="#" className="text-primary hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-5 border-b border-border">
        <Link to="/" className="inline-flex items-center gap-2 font-display text-base font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
            <Compass className="h-4 w-4" />
          </span>
          Career<span className="text-primary">Bridge</span>
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {label}
      </label>
      <span className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring transition-shadow">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        {children}
      </span>
    </div>
  );
}
