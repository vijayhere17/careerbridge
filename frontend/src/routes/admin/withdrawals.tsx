import { createFileRoute } from "@tanstack/react-router";
import { AdminWithdrawalsPage } from "@/components/admin/Withdrawals";

export const Route = createFileRoute("/admin/withdrawals")({
  component: AdminWithdrawalsPage,
});
