import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardPage } from "@/components/admin/Dashboard";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});
