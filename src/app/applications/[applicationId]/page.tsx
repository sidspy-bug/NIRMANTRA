import React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { ApplicationDossierView } from "@/components/applications/application-dossier-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return {
    title: `Application Dossier (${applicationId}) - NIRMAANTRA`,
  };
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;

  return (
    <PageContainer
      title="Building Plan Scrutiny Dossier"
      description="Detailed application parameters, drawing attachments, transparent AI screening statuses, and authorized municipal supervisor review desk."
      breadcrumbs={[
        { label: "Building Services", href: "/applications" },
        { label: "Application Registry", href: "/applications" },
        { label: applicationId },
      ]}
    >
      <ApplicationDossierView applicationId={applicationId} />
    </PageContainer>
  );
}
