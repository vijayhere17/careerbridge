import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  Briefcase, GraduationCap, UserPlus, UsersRound, ShieldCheck,
  Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, Phone, Mail, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch, setAuth, type AuthUser } from "@/lib/auth";
import { AuthCard, AuthField } from "./login";

export const Route = createFileRoute("/signup")({ component: SignupPage });
type Role = AuthUser["role"];

const USER_TYPES: { role: Role; label: string; subtitle: string; icon: React.ElementType }[] = [
  { role: "seeker",               label: "Job Seeker",           subtitle: "Student or Job Seeker looking for mentors and opportunities", icon: GraduationCap },
  { role: "mentor",               label: "Mentor",               subtitle: "Working professional ready to guide and mentor candidates",    icon: UsersRound },
  { role: "opportunity_provider", label: "Recruiter",            subtitle: "Company or individual recruiter posting opportunities",    icon: Briefcase },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex gap-1.5 mb-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < current ? "bg-primary" : i === current ? "bg-primary/50" : "bg-muted"}`} />
      ))}
    </div>
  );
}

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.replace(/\D/g, "").slice(0, 6);
  const chars = Array.from({ length: 6 }, (_, i) => digits[i] ?? "");

  const handle = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = Array.from({ length: 6 }, (_, idx) => (idx === i ? digit : chars[idx]));
    onChange(next.join(""));
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Backspace") return;
    if (chars[i]) {
      const next = [...chars];
      next[i] = "";
      onChange(next.join(""));
      return;
    }
    if (i > 0) {
      e.preventDefault();
      const next = [...chars];
      next[i - 1] = "";
      onChange(next.join(""));
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(Math.max(pasted.length, 1) - 1, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {chars.map((char, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={char}
          onChange={(e) => handle(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className={`h-12 w-10 rounded-xl border text-center text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-ring ${char ? "border-primary bg-primary/5" : "border-border bg-background"}`}
        />
      ))}
    </div>
  );
}

function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp" | "role">("details");
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", otp: "" });
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor  = ["", "bg-red-400", "bg-amber-400", "bg-primary"];

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const r = await apiFetch<{ dev_otp?: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDevOtp(r.dev_otp ?? "");
      setStep("otp");
    } catch (err: any) {
      setError(err?.message ?? "Could not start registration.");
    } finally {
      setSaving(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.otp.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    setError("");
    setSaving(true);
    try {
      const r = await apiFetch<{ user: AuthUser; api_token: string }>("/api/auth/verify-registration", {
        method: "POST",
        body: JSON.stringify({ email: form.email, otp: form.otp }),
      });
      setAuth(r.user, r.api_token);
      setStep("role");
    } catch (err: any) {
      const otpError = err?.errors?.otp?.[0];
      setError(otpError ?? err?.message ?? "OTP is invalid or expired.");
    } finally {
      setSaving(false);
    }
  };

  const chooseRole = async () => {
    if (!selectedRole) return;
    setError("");
    setSaving(true);
    try {
      const r = await apiFetch<{
        user: AuthUser;
        recruiter_onboarding?: {
          can_access_dashboard?: boolean;
          next_step?: string;
        } | null;
      }>("/api/auth/select-role", {
        method: "POST",
        body: JSON.stringify({ role: selectedRole }),
      });
      const token = localStorage.getItem("cb-token");
      if (token) setAuth(r.user, token);
      const redirectTo =
        selectedRole === "opportunity_provider"
          ? "/recruiter/onboarding"
          : "/dashboard";
      router.navigate({ to: redirectTo });
    } catch (err: any) {
      setError(err?.message ?? "Could not select role.");
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = { details: 0, otp: 1, role: 2 };

  const titles = {
    details: "Create your account",
    otp:     "Verify your identity",
    role:    "Choose your role",
  };

  const subtitles = {
    details: "Join CareerBridge — it's free",
    otp:     `OTP sent to ${form.email}`,
    role:    "Select the role that best describes you",
  };

  return (
    <AuthCard title={titles[step]} subtitle={subtitles[step]}>
      <StepBar current={stepIndex[step]} />

      {step === "details" && (
        <form onSubmit={send} className="space-y-4">
          <AuthField label="Full Name" icon={UserPlus}>
            <input
              required
              value={form.name}
              onChange={update("name")}
              placeholder="Vijay Kumar"
              className="auth-input"
            />
          </AuthField>

          <AuthField label="Email Address" icon={Mail}>
            <input
              required
              type="email"
              value={form.email}
              onChange={update("email")}
              placeholder="you@example.com"
              className="auth-input"
            />
          </AuthField>

          <AuthField label="Mobile Number" icon={Phone}>
            <input
              required
              value={form.mobile}
              onChange={update("mobile")}
              placeholder="9876543210"
              inputMode="numeric"
              className="auth-input"
            />
          </AuthField>

          <div>
            <AuthField label="Password" icon={Lock}>
              <input
                required
                type={showPass ? "text" : "password"}
                minLength={8}
                value={form.password}
                onChange={update("password")}
                placeholder="Min. 8 characters"
                className="auth-input"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </AuthField>
            {form.password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : "bg-muted"}`} />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">{strengthLabel[strength]}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" variant="brand" size="lg" className="w-full" disabled={saving}>
            {saving
              ? "Sending OTP…"
              : <span className="flex items-center justify-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span>}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-1">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-primary hover:underline">Sign in</a>
          </p>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verify} className="space-y-5">
          <div className="text-center space-y-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 mx-auto">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <OtpBoxes
              value={form.otp}
              onChange={(v) => setForm((f) => ({ ...f, otp: v }))}
            />
            {devOtp && (
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">Dev OTP: <span className="font-bold text-primary tracking-widest">{devOtp}</span></p>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStep("details"); setError(""); setForm((f) => ({ ...f, otp: "" })); }}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <Button type="submit" variant="brand" size="lg" className="flex-1" disabled={saving || form.otp.length < 6}>
              {saving
                ? "Verifying…"
                : <span className="flex items-center justify-center gap-2">Verify <ArrowRight className="h-4 w-4" /></span>}
            </Button>
          </div>
        </form>
      )}

      {step === "role" && (
        <div className="space-y-4">
          <div className="space-y-2">
            {USER_TYPES.map(({ role, label, subtitle, icon: Icon }) => (
              <button
                key={role}
                type="button"
                disabled={saving}
                onClick={() => setSelectedRole(role)}
                className={`w-full flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                  selectedRole === role
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
                </div>
                <div className={`mt-1 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${selectedRole === role ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                  {selectedRole === role && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStep("otp"); setError(""); setSelectedRole(null); }}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <Button
              variant="brand"
              size="lg"
              className="flex-1"
              disabled={!selectedRole || saving}
              onClick={chooseRole}
            >
              {saving
                ? "Creating account…"
                : <span className="flex items-center justify-center gap-2">Get Started <ArrowRight className="h-4 w-4" /></span>}
            </Button>
          </div>
        </div>
      )}
    </AuthCard>
  );
}