import { createFileRoute } from "@tanstack/react-router";
import { UnlockEarnings } from "@/components/recruiter/unlock-earnings";

export const Route = createFileRoute("/recruiter/unlock-earnings")({
  component: UnlockEarnings,
});
