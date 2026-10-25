import React, { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { GrievanceSubmissionForm } from "@/components/grievances/grievance-submission-form";

export const metadata = {
  title: "Report Building Safety Violation - NIRMAANTRA",
};

export default function SubmitGrievancePage() {
  return (
    <PageContainer
      title="File Building Safety Grievance"
      description="Report suspected unauthorized constructions, locked fire corridors, setback violations, or dangerous structural defects to municipal enforcement."
      breadcrumbs={[
        { label: "Citizen's Corner", href: "/grievances" },
        { label: "Public Grievances", href: "/grievances" },
        { label: "File Grievance" },
      ]}
    >
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Form...</div>}>
        <GrievanceSubmissionForm />
      </Suspense>
    </PageContainer>
  );
}
