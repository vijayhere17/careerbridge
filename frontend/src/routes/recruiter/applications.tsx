import { createFileRoute } from "@tanstack/react-router";
import { ApplicationsPage } from "@/components/recruiter/applications";

export const Route = createFileRoute("/recruiter/applications")({
  component: ApplicationsPage,
});
