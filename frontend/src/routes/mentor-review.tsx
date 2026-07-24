import { createFileRoute } from "@tanstack/react-router";
import { MentorReviewPage } from "@/components/mentor/MentorReview";

export const Route = createFileRoute("/mentor-review")({
  component: MentorReviewPage,
});