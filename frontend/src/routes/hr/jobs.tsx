import { createFileRoute } from "@tanstack/react-router";
import { HrJobsPage } from "@/components/hr/Jobs";

export const Route = createFileRoute("/hr/jobs")({
  component: HrJobsPage,
});
