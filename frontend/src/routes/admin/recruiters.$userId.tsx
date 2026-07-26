import { createFileRoute } from "@tanstack/react-router";
import { AdminRecruiterDetailPage } from "@/components/admin/RecruiterDetail";

export const Route = createFileRoute("/admin/recruiters/$userId")({
  component: function AdminRecruiterDetailRoute() {
    const { userId } = Route.useParams();
    return <AdminRecruiterDetailPage userId={Number(userId)} />;
  },
});
