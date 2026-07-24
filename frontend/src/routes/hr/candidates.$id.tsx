import { createFileRoute } from "@tanstack/react-router";
import { HrCandidateDetailPage } from "@/components/hr/Candidates";

export const Route = createFileRoute("/hr/candidates/$id")({
  component: HrCandidateRoute,
});

function HrCandidateRoute() {
  const { id } = Route.useParams();
  return <HrCandidateDetailPage candidateId={Number(id)} />;
}
