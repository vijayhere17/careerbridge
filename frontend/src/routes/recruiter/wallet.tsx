import { createFileRoute } from "@tanstack/react-router";
import { WalletPage } from "@/components/recruiter/wallet";

export const Route = createFileRoute("/recruiter/wallet")({
  component: WalletPage,
});
