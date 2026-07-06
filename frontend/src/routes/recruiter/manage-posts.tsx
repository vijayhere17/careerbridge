import { createFileRoute } from "@tanstack/react-router";
import { ManagePosts } from "@/components/recruiter/manage-posts";

export const Route = createFileRoute("/recruiter/manage-posts")({
  component: ManagePosts,
});
