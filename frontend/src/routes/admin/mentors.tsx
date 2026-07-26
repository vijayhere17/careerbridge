import { createFileRoute } from "@tanstack/react-router";
import { AdminMentorsListPage } from "@/components/admin/MentorsList";

export const Route = createFileRoute("/admin/mentors")({
  component: () => <AdminMentorsListPage />,
});
