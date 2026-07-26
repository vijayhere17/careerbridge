import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersListPage } from "@/components/admin/UsersList";

export const Route = createFileRoute("/admin/job-seekers")({
  component: () => <AdminUsersListPage kind="seekers" />,
});
