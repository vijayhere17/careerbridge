import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/recruiter/notifications";

export const Route = createFileRoute("/recruiter/notifications")({
  component: NotificationsPage,
});
