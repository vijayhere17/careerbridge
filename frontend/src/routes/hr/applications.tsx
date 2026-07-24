import { createFileRoute } from "@tanstack/react-router";
import { HrApplicationsPage } from "@/components/hr/Applications";

export const Route = createFileRoute("/hr/applications")({
  component: HrApplicationsPage,
});
