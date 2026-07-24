import { createFileRoute } from "@tanstack/react-router";
import { HrDashboard } from "@/components/hr/Dashboard";

export const Route = createFileRoute("/hr/")({
  component: HrDashboard,
});
