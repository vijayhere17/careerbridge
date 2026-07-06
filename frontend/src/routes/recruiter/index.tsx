import { createFileRoute } from "@tanstack/react-router";
import { RecruiterDashboard } from "@/components/recruiter/index";

export const Route = createFileRoute("/recruiter/")({
  component: RecruiterDashboard,
});
