import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsPage } from "@/components/admin/Settings";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});
