import React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { StatusLookup } from "@/components/tracking/status-lookup";

export const metadata = {
  title: "Application Tracking - NIRMAANTRA",
};

export default function TrackApplicationPage() {
  return (
    <PageContainer
      title="Application Tracking & Audit Status"
      description="Track the exact regulatory verification stage of any building permit, scrutiny remarks, and officer allocations."
      breadcrumbs={[{ label: "Application Tracking" }]}
    >
      <StatusLookup />
    </PageContainer>
  );
}
