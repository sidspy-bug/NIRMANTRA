import React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { GrievanceDossierView } from "@/components/grievances/grievance-dossier-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grievanceId: string }>;
}) {
  const { grievanceId } = await params;
  return {
    title: `Grievance Record (${grievanceId}) - NIRMAANTRA`,
  };
}

export default async function GrievanceDetailPage({
  params,
}: {
  params: Promise<{ grievanceId: string }>;
}) {
  const { grievanceId } = await params;

  return (
    <PageContainer
      title="Public Grievance Dossier & Disposition"
      description="Review submitted citizen concern, examine evidence, and view official investigating officer disposition."
      breadcrumbs={[
        { label: "Citizen's Corner", href: "/grievances" },
        { label: "Public Grievances", href: "/grievances" },
        { label: grievanceId },
      ]}
    >
      <GrievanceDossierView grievanceId={grievanceId} />
    </PageContainer>
  );
}
