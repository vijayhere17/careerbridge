import { createFileRoute } from "@tanstack/react-router";
import { PostNewOpportunity } from "@/components/recruiter/post-new";

export const Route = createFileRoute("/recruiter/post-new")({
  component: PostNewOpportunity,
});
