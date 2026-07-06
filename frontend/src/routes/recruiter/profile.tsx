import { createFileRoute } from "@tanstack/react-router";
import { RecruiterProfilePage } from "@/components/recruiter/profile";

export const Route = createFileRoute("/recruiter/profile")({
  component: RecruiterProfilePage,
});
