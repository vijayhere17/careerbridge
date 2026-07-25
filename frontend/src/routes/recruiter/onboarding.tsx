import { createFileRoute } from "@tanstack/react-router";
import { RecruiterOnboardingPage } from "@/components/recruiter/onboarding/RecruiterOnboarding";

export const Route = createFileRoute("/recruiter/onboarding")({
  component: RecruiterOnboardingPage,
});
