import { createFileRoute } from "@tanstack/react-router";
import { HrCandidatesPage } from "@/components/hr/Candidates";

export const Route = createFileRoute("/hr/candidates")({
  component: HrCandidatesPage,
});
