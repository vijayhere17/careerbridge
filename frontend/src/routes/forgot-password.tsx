import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  Mail, Shield, Lock, Eye, EyeOff,
  ArrowRight, ArrowLeft, CheckCircle2, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/auth";
import { AuthShell, AuthField } from "./login";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

type Step = "email" | "otp" | "newpassword" | "success";

function OtpInput({ length = 6, onChange }: { length?: number; onChange: (v: string) => void }) {
  const [values, setValues] = useState(Array(length).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handle = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...values];
    next[i] = val;
    setValues(next);
    onChange(next.join(""));
    if (val && i < length - 1) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    const next = [...values];
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setValues(next);
    onChange(next.join(""));
    inputs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handle(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className={`h-12 w-11 rounded-xl border text-center text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-ring ${v ? "border-primary bg-primary/5" : "border-border bg-background"}`}
        />
      ))}
    </div>
  );
}

function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Good", "Strong"];
  const strengthColor  = ["", "bg-red-400", "bg-amber-400", "bg-primary"];

  const startResendTimer = () => {
    setResendTimer(30);
    const id = setInterval(() => {
      setResendTimer((t) => { if (t <= 1) { clearInterval(id); return 0; } return t - 1; });
    }, 1000);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } catch {
    } finally {
      setSaving(false);
      setStep("otp");
      startResendTimer();
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    setError("");
    setSaving(true);
    try {
      await apiFetch("/api/auth/verify-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      setStep("newpassword");
    } catch (err: any) {
      setError(err?.message ?? "Invalid OTP. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strength < 2) { setError("Please choose a stronger password."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setSaving(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, password }),
      });
      setStep("success");
    } catch (err: any) {
      setError(err?.message ?? "Could not reset password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const stepIndex: Record<Step, number> = { email: 0, otp: 1, newpassword: 2, success: 3 };

  const StepBar = () => (
    <div className="flex items-center gap-2 mb-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < stepIndex[step] ? "bg-primary" : i === stepIndex[step] ? "bg-primary/60" : "bg-muted"}`} />
      ))}
    </div>
  );

  if (step === "success") {
    return (
      <AuthShell title="Password Updated!" subtitle="You can now sign in with your new password.">
        <div className="flex flex-col items-center py-6 text-center gap-5">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Your password has been reset successfully.</p>
          <Button
            variant="brand"
            size="lg"
            className="w-full"
            onClick={() => router.navigate({ to: "/login" })}
          >
            <span className="flex items-center justify-center gap-2">
              Sign In Now <ArrowRight className="h-4 w-4" />
            </span>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={
        step === "email"       ? "Forgot your password?" :
        step === "otp"         ? "Check your email" :
        "Create new password"
      }
      subtitle={
        step === "email"       ? "Enter your registered email to receive an OTP" :
        step === "otp"         ? `We sent a 6-digit OTP to ${email}` :
        "Choose a strong password for your account"
      }
    >
      <StepBar />

      {step === "email" && (
        <form onSubmit={handleEmail} className="space-y-4">
          <AuthField label="Registered Email" icon={Mail}>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
            />
          </AuthField>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" variant="brand" size="lg" className="w-full" disabled={saving}>
            {saving ? "Sending OTP…" : <span className="flex items-center justify-center gap-2">Send OTP <ArrowRight className="h-4 w-4" /></span>}
          </Button>

          <div className="text-center">
            <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleOtp} className="space-y-6">
          <div className="text-center space-y-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 mx-auto">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <OtpInput onChange={setOtp} />
            <p className="text-xs text-muted-foreground">
              Didn't receive it?{" "}
              {resendTimer > 0 ? (
                <span>Resend in {resendTimer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={startResendTimer}
                  className="text-primary font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <Button type="submit" variant="brand" size="lg" className="flex-1" disabled={saving || otp.length < 6}>
              {saving ? "Verifying…" : <span className="flex items-center justify-center gap-2">Verify <ArrowRight className="h-4 w-4" /></span>}
            </Button>
          </div>
        </form>
      )}

      {step === "newpassword" && (
        <form onSubmit={handleReset} className="space-y-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 mx-auto mb-2">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>

          <div>
            <AuthField label="New Password" icon={Lock}>
              <input
                required
                type={showPass ? "text" : "password"}
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="auth-input"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </AuthField>
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor[strength] : "bg-muted"}`} />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">{strengthLabel[strength]}</span>
              </div>
            )}
          </div>

          <AuthField label="Confirm Password" icon={Lock}>
            <input
              required
              type={showConfirm ? "text" : "password"}
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              className="auth-input"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </AuthField>

          {confirm && password !== confirm && (
            <p className="text-xs text-destructive">Passwords do not match.</p>
          )}

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setStep("otp"); setError(""); }}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="flex-1"
              disabled={saving || !password || password !== confirm}
            >
              {saving ? "Updating…" : <span className="flex items-center justify-center gap-2">Update Password <ArrowRight className="h-4 w-4" /></span>}
            </Button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}