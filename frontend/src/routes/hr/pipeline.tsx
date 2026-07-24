import { createFileRoute } from "@tanstack/react-router";
import { HrPipelinePage } from "@/components/hr/Pipeline";

export const Route = createFileRoute("/hr/pipeline")({
  component: HrPipelinePage,
});
