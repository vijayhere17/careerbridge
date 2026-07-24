import { createFileRoute } from "@tanstack/react-router";
import { HrCompanyProfilePage } from "@/components/hr/CompanyProfile";

export const Route = createFileRoute("/hr/company")({
  component: HrCompanyProfilePage,
});
