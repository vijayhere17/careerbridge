import { createFileRoute } from "@tanstack/react-router";
import { HrSettingsPage } from "@/components/hr/Settings";

export const Route = createFileRoute("/hr/settings")({
  component: HrSettingsPage,
});
