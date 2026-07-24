import { createFileRoute } from "@tanstack/react-router";
import { HrInterviewsPage } from "@/components/hr/Interviews";

export const Route = createFileRoute("/hr/interviews")({
  component: HrInterviewsPage,
});
