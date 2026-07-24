import { createFileRoute } from "@tanstack/react-router";
import { HrNotificationsPage } from "@/components/hr/Settings";

export const Route = createFileRoute("/hr/notifications")({
  component: HrNotificationsPage,
});
