import React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { InspectionVisitDesk } from "@/components/inspection/inspection-visit-desk";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ inspectionId: string }>;
}) {
  const { inspectionId } = await params;
  return {
    title: `Inspection Audit (${inspectionId}) - NIRMAANTRA`,
  };
}

import { RoleGuard } from "@/components/auth/role-guard";

export default async function InspectionDetailPage({
  params,
}: {
  params: Promise<{ inspectionId: string }>;
}) {
  const { inspectionId } = await params;

  return (
    <RoleGuard allowedRoles={["Inspecting Officer", "Supervisor"]}>
      <PageContainer
        title="Field Inspection & Site Audit Desk"
        description="Record multi-view site photographs, certified field observations, and compliance determinations. Governed by 6-month statutory audit cycles."
        breadcrumbs={[
          { label: "Inspection Department", href: "/inspections" },
          { label: inspectionId },
        ]}
      >
        <InspectionVisitDesk inspectionId={inspectionId} />
      </PageContainer>
    </RoleGuard>
  );
}
