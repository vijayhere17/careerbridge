import { createFileRoute } from "@tanstack/react-router";
import { MessagesPage } from "@/components/recruiter/messages";

export const Route = createFileRoute("/recruiter/messages")({
  component: MessagesPage,
});
