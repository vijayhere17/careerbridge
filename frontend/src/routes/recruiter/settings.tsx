import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/recruiter/settings";

export const Route = createFileRoute("/recruiter/settings")({
  component: SettingsPage,
});
