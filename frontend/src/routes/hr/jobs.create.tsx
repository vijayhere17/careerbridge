import { createFileRoute } from "@tanstack/react-router";
import { HrJobFormPage } from "@/components/hr/Jobs";

export const Route = createFileRoute("/hr/jobs/create")({
  component: () => <HrJobFormPage />,
});
