import { createFileRoute } from "@tanstack/react-router";
import { AdminRecruitersPage } from "@/components/admin/Recruiters";

export const Route = createFileRoute("/admin/recruiters/")({
  component: AdminRecruitersPage,
});
