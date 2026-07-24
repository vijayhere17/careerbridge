import { createFileRoute } from "@tanstack/react-router";
import { HrJobFormPage } from "@/components/hr/Jobs";

export const Route = createFileRoute("/hr/jobs/$id/edit")({
  component: HrJobEditPage,
});

function HrJobEditPage() {
  const { id } = Route.useParams();
  return <HrJobFormPage jobId={Number(id)} />;
}
