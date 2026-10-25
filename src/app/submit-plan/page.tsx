import React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { GuidedPlanSubmission } from "@/components/submission/guided-plan-submission";

export const metadata = {
  title: "Building Plan Submission - NIRMAANTRA",
};

export default function SubmitPlanPage() {
  return (
    <PageContainer
      title="Building Plan Submission (Single-Window Portal)"
      description="Three-step guided submission for commercial, residential, and institutional building plans. Automated screening and municipal supervisor review workflow."
      breadcrumbs={[
        { label: "Building Services", href: "/applications" },
        { label: "Submit Building Plan" },
      ]}
    >
      <GuidedPlanSubmission />
    </PageContainer>
  );
}
