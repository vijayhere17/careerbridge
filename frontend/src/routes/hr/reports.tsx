import { createFileRoute } from "@tanstack/react-router";
import { HrReportsPage } from "@/components/hr/Reports";

export const Route = createFileRoute("/hr/reports")({
  component: HrReportsPage,
});
