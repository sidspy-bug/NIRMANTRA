import React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { UidProfileView } from "@/components/building-profile/uid-profile-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  return {
    title: `Building Record (${uid}) - NIRMAANTRA`,
  };
}

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  return (
    <PageContainer
      title="Public Building UID & QR Record"
      description="Official municipal registry record showing statutory clearances, fire safety NOC validity, 6-month inspection reports, and disclosed overrides."
      breadcrumbs={[
        { label: "Citizen's Corner", href: "/buildings" },
        { label: "Building Registry", href: "/buildings" },
        { label: uid },
      ]}
    >
      <UidProfileView uid={uid} />
    </PageContainer>
  );
}
