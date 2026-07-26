import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/components/recruiter/analytics";

export const Route = createFileRoute("/recruiter/analytics")({
  component: AnalyticsPage,
});
