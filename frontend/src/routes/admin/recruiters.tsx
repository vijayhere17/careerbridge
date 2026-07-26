import { createFileRoute } from "@tanstack/react-router";
import { AdminRecruitersPage } from "@/components/admin/Recruiters";

export const Route = createFileRoute("/admin/recruiters")({
  component: AdminRecruitersPage,
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : undefined,
    type: typeof search.type === "string" ? search.type : undefined,
    search: typeof search.search === "string" ? search.search : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
    date_from: typeof search.date_from === "string" ? search.date_from : undefined,
    date_to: typeof search.date_to === "string" ? search.date_to : undefined,
  }),
});
