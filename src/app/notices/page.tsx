import React from "react";
import { PageContainer } from "@/components/layout/page-container";
import { NoticesMapView } from "@/components/notices-map/notices-map-view";

export const metadata = {
  title: "Notices & Geospatial Safety Map - NIRMAANTRA",
};

export default function NoticesPage() {
  return (
    <PageContainer
      title="Public Safety Notices & Geospatial Registry"
      description="Official municipal notices, statutory inspection circulars, and verified building spatial plots for public accountability."
      breadcrumbs={[
        { label: "Notices & Updates", href: "/notices" },
        { label: "Safety Advisories & Map" },
      ]}
    >
      <NoticesMapView />
    </PageContainer>
  );
}
