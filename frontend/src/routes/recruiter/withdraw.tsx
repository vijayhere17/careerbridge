import { createFileRoute } from "@tanstack/react-router";
import { WithdrawPage } from "@/components/recruiter/withdraw";

export const Route = createFileRoute("/recruiter/withdraw")({
  component: WithdrawPage,
});
