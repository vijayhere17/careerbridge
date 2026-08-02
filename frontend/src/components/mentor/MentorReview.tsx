import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Clock3, ShieldCheck, FileCheck2, Search, BadgeCheck, Rocket,
  RefreshCw, LogOut, AlertTriangle, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/common/BrandLogo";
import { apiFetch, clearAuth, type AuthUser } from "@/lib/auth";

type OnboardingStatus = "profile_setup" | "under_review" | "approved" | "rejected";

type UserStatusResponse = {
  user: AuthUser;
  mentor_onboarding?: {
    has_profile: boolean;
    status: OnboardingStatus;
    verified: boolean;
  };
};

/* ────────────────────────────────────────────────────────────
   Small building blocks
   ──────────────────────────────────────────────────────────── */

function BrandHeader() {
  return <BrandLogo size="sm" asLink={false} />;
}

type FlowStepState = "done" | "active" | "pending";

function FlowStep({
  icon: Icon, title, desc, state, isLast,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  state: FlowStepState;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-all ${
            state === "done"
              ? "border-primary bg-primary text-primary-foreground"
              : state === "active"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[1.75rem] ${state === "done" ? "bg-primary" : "bg-border"}`} />
        )}
      </div>
      <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
        <p className={`text-sm font-semibold ${state === "pending" ? "text-muted-foreground" : "text-foreground"}`}>
          {title}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────── */

export function MentorReviewPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [stillReviewMessage, setStillReviewMessage] = useState(false);
  const [rejected, setRejected] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    setError("");
    setStillReviewMessage(false);
    try {
      const r = await apiFetch<UserStatusResponse>("/api/auth/user");
      const status = r.mentor_onboarding?.status;

      if (status === "approved") {
        router.navigate({ to: "/dashboard" });
        return;
      }
      if (status === "rejected") {
        setRejected(true);
        return;
      }
      // still under_review (or anything else) — stay on this page
      setRejected(false);
      setStillReviewMessage(true);
    } catch (err: unknown) {
  setError(
    err instanceof Error
      ? err.message
      : "Could not check your review status. Please try again."
  );
    } finally {
      setChecking(false);
    }
  };

  const signOut = async () => {
    try { await apiFetch("/api/auth/logout", { method: "POST" }); } finally {
      clearAuth();
      router.navigate({ to: "/login" });
    }
  };

  const updateProfile = () => {
    router.navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="container-page flex h-16 items-center">
          <BrandHeader />
        </div>
      </header>

      <main className="container-page max-w-xl py-8 sm:py-12">
        {/* Status hero */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-400/15 mb-4">
            <Clock3 className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold">Profile Under Review</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
            Thanks for completing your mentor profile. Our team is reviewing your details before making your profile live.
          </p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-600">
            <Clock3 className="h-3.5 w-3.5" /> Under Review
          </span>
        </div>

        {/* Progress flow */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Onboarding Progress
          </p>
          <FlowStep
            icon={FileCheck2}
            title="Profile Submitted"
            desc="Your mentor profile details have been received."
            state="done"
          />
          <FlowStep
            icon={Search}
            title="Verification in Progress"
            desc="Our team is reviewing your experience and expertise."
            state="active"
          />
          <FlowStep
            icon={BadgeCheck}
            title="Profile Approval"
            desc="You'll be notified once your profile is approved."
            state="pending"
          />
          <FlowStep
            icon={Rocket}
            title="Start Mentoring"
            desc="Access your mentor dashboard and receive bookings."
            state="pending"
            isLast
          />
        </div>

        {/* What happens next */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 mb-4">
          <p className="text-sm font-semibold mb-3.5">What happens next?</p>
          <div className="space-y-3">
            <InfoRow icon={ShieldCheck} text="Our team reviews your professional details, experience and expertise." />
            <InfoRow icon={BadgeCheck} text="You will be notified once your mentor profile is approved." />
            <InfoRow icon={Rocket} text="After approval, you can access your mentor dashboard and start receiving bookings." />
          </div>
        </div>

        {/* Status notice */}
        <div className="flex items-start gap-2.5 rounded-2xl bg-muted/50 border border-border p-4 mb-4">
          <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Review usually takes some time. You can safely leave this page and check your status again later.
          </p>
        </div>

        {rejected && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 mb-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Your profile needs some updates before approval.</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Please review your mentor details and submit your profile again.
                </p>
              </div>
            </div>
            <Button variant="brand" size="lg" className="w-full mt-4" onClick={updateProfile}>
              Update Profile
            </Button>
          </div>
        )}

        {stillReviewMessage && !rejected && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 px-3.5 py-2.5 mb-4">
            <p className="text-xs font-medium text-primary">Your profile is still under review.</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 mb-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Primary action */}
        <Button
          variant="brand"
          size="lg"
          className="w-full"
          disabled={checking}
          onClick={checkStatus}
        >
          <span className="flex items-center justify-center gap-2">
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking Status…" : "Check Review Status"}
          </span>
        </Button>

        {/* Secondary action */}
        <button
          type="button"
          onClick={signOut}
          className="mx-auto mt-4 flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </main>
    </div>
  );
}