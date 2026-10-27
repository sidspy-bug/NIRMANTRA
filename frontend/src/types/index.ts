export type BuildingCategory =
  | "Educational Building"
  | "Hospital & Healthcare"
  | "Hotel"
  | "Shopping Center"
  | "Educational"
  | "Hospital"
  | "Commercial"
  | "Residential"
  | "Institutional"
  | "Industrial"
  | "Assembly"
  | "Hazardous";

export type ApplicationStatus =
  | "Submitted"
  | "Awaiting AI Analysis"
  | "AI Screening Integration Pending"
  | "Under Human Review"
  | "Approved"
  | "Rejected"
  | "Clarification Requested";

export interface PlanDocument {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  category: "Architectural Drawing" | "Structural Affidavit" | "Fire Safety Plan" | "Site Layout" | "Other";
  uploadProgress?: number;
  uploadedAt: string;
  previewUrl?: string;
  sha256Hash?: string;
}

export interface SupervisorOverride {
  overrideId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  timestamp: string;
  originalFinding: string;
  decision: "Approved" | "Rejected";
  writtenJustification: string;
  supportingEvidenceUrls?: string[];
  publiclyDisclosed: boolean;
}

export interface ApplicationRecord {
  id: string; // e.g. "BLD-2026-98124"
  applicantName: string;
  applicantEmail: string;
  buildingName: string;
  state: string;
  city: string;
  plotAddress: string;
  plotArea: number;
  plotAreaUnit: "sq.m" | "sq.ft" | "sq.yards";
  buildingCategory: BuildingCategory;
  proposedHeightMeters?: number;
  submittedAt: string;
  status: ApplicationStatus;
  statusRemarks: string;
  documents: PlanDocument[];
  mlScreeningStatus: "Not Configured" | "Pending" | "Completed" | "Model Integration Pending";
  mlFindings?: {
    modelAvailable: boolean;
    notice: string;
    details?: string;
  };
  humanReviewAssignedTo?: string;
  humanReviewDeadline?: string; // 3-4 days policy
  supervisorDecision?: {
    decidedBy: string;
    decidedAt: string;
    decision: "Approved" | "Rejected";
    reason?: string;
  };
  supervisorOverride?: SupervisorOverride;
  issuedCertificate?: {
    certificateId: string;
    issuedAt: string;
    validUntil: string;
    isVerifiedRealDocument: boolean;
    verificationNotice: string;
  };
  assignedBuildingUid?: string;
  isDemoFixture?: boolean;
  complianceReport?: ComplianceReport;
}

export type ComplianceStatusEnum = "COMPLIANT" | "NON_COMPLIANT" | "REQUIRES_REVIEW";
export type FindingRuleStatusEnum = "PASS" | "FAIL" | "NEEDS_REVIEW" | "NOT_APPLICABLE";

export interface GroundedFinding {
  rule_id: string;
  rule_name: string;
  status: FindingRuleStatusEnum;
  explanation: string;
  regulatory_citations: string[];
  next_steps: string[];
  requires_human_review: boolean;
  missing_evidence: string[];
}

export interface ReportSummary {
  overall_status: ComplianceStatusEnum;
  total_requirements_checked: number;
  passed_count: number;
  failed_count: number;
  needs_review_count: number;
  not_applicable_count: number;
  compliance_score_percent: number;
}

export interface ComplianceReport {
  report_id: string;
  generated_at: string;
  project_name: string;
  location_address?: string | null;
  source_document?: string | null;
  jurisdiction: string;
  summary: ReportSummary;
  findings: GroundedFinding[];
  missing_information_checklist: string[];
  actionable_recommendations: string[];
  disclaimer: string;
}

export type InspectionStatus = "Scheduled" | "Completed" | "Overdue" | "Cancelled";

export interface InspectionPhoto {
  id: string;
  caption: string;
  viewType: "Exterior Front" | "Exterior Rear" | "Setback Driveway" | "Fire Staircase" | "Basement Riser" | "Interior Lobby" | "Rooftop Tank" | "Electrical Room";
  timestamp: string;
  url: string;
}

export interface LiveVideoEvidence {
  id: string;
  buildingUid: string;
  inspectionId: string;
  recordedAt: string;
  durationSeconds: number;
  officerId: string;
  officerName: string;
  videoUrl?: string;
  storageKey: string;
  telemetry: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    altitudeMeters?: number | null;
  };
  tamperProofHash: string;
  caption?: string;
}

export interface InspectionRecord {
  id: string; // e.g. "INS-2026-081"
  buildingUid: string;
  buildingName: string;
  location: string;
  assignedOfficer: string;
  assignedOfficerId: string;
  scheduledDate: string;
  dueDate: string;
  gracePeriodEndsAt: string; // 15 days grace period
  status: InspectionStatus;
  completedAt?: string;
  targetPhotoCountMin: number;
  targetPhotoCountMax: number;
  photos: InspectionPhoto[];
  inspectorObservations?: string;
  aiImageAnalysisStatus: "Model Integration Pending" | "Analyzed";
  aiObservationsNotice: string;
  isAccountBlocked?: boolean;
  accountBlockNotice?: string;
  isDemoFixture?: boolean;
  liveVideoEvidence?: LiveVideoEvidence;
}

export interface BuildingSafetyRecord {
  fireSafety: {
    nocNumber: string;
    nocIssueDate: string;
    nocExpiryDate: string;
    dfsClearanceStatus: "Verified Valid NOC" | "Expired" | "Under Renewal" | "Provisional";
    fireStaircasesCount: number;
    staircaseWidthM: number;
    corridorWidthM: number;
    evacuationRampStatus: string;
    travelDistanceToExitM: number;
    sprinklerCoverage: string;
    hydrantPressurePsi: number;
    firePumpsStatus: string;
    refugeFloors: string[];
    lastFireDrillDate: string;
    nextFireDrillDue: string;
    fireAlarmPanel: string;
    smokeManagementSystem: string;
  };
  structuralSafety: {
    stabilityCertificateNumber: string;
    structuralEngineer: string;
    seismicDesignZone: string;
    loadAuditDate: string;
    structuralHealthStatus: string;
    foundationType: string;
    cantileverDeflectionAudit: string;
  };
  electricalSafety: {
    ceaComplianceStatus: string;
    transformerCapacity: string;
    dgBackupCapacity: string;
    lastThermalImagingAudit: string;
    earthingResistanceOhms: number;
    lightningProtectionSystem: string;
  };
  emergencyContacts: {
    safetyOfficerName: string;
    safetyOfficerPhone: string;
    facilityManagerPhone: string;
    nearestFireStation: string;
    nearestFireStationPhone: string;
    nearestTraumaCenter: string;
    nearestTraumaCenterPhone: string;
    assemblyArea: string;
  };
  overallSafetyScorePercent: number;
  overallSafetyGrade: "Grade A+ (Exemplary)" | "Grade A (Fully Compliant)" | "Grade B (Minor Advisory)" | "Grade C (Critical Notice)";
}

export interface BuildingMaintenanceRecord {
  liftsAndEscalators: {
    passengerLiftsCount: number;
    serviceBedLiftsCount: number;
    escalatorsCount?: number;
    amcVendor: string;
    liftLicenseNumber: string;
    licenseExpiryDate: string;
    lastServicedDate: string;
    nextServiceDueDate: string;
    automaticRescueDevice: string;
    loadCalibrationStatus: string;
  };
  waterAndFireTanks: {
    undergroundFireTankLitres: number;
    terraceFireTankLitres: number;
    jockeyPumpAutomation: string;
    waterLevelMonitoring: string;
    lastWaterHygieneChlorination: string;
    potableWaterAuditDate: string;
  };
  hvacAndAirQuality: {
    chillerSystemType: string;
    iaqFilterRating: string;
    smokeExtractionCapacityCfm: number;
    lastDuctInspectionDate: string;
    uvgiSanitization: boolean;
  };
  facilityServices: {
    cctvCoverageCameras: number;
    cctvRetentionDays: number;
    facadeCleaningCertExpiry: string;
    pestControlSanitizationDate: string;
    solidWasteSegregationStatus: string;
    solarRooftopCapacityKw?: number;
  };
}

export interface BuildingRecord {
  uid: string; // e.g. "NB-DL-2026-881"
  buildingName: string;
  address: string;
  ward: string;
  zone: string;
  category: BuildingCategory;
  approvalStatus: "Approved Plan" | "Provisional Under Scrutiny" | "Under Construction" | "Unverified / Notice Served";
  approvedPlanReference?: string;
  planApprovalDate?: string;
  fireSafetyNocStatus: "Verified Valid" | "Expired" | "Not Verified" | "Not Available";
  fireSafetyNocExpiry?: string;
  environmentalClearanceStatus: "Verified" | "Not Required" | "Not Verified" | "Not Available";
  occupancyCertificateStatus: "Issued & Active" | "Provisional" | "Not Available / In Progress";
  latestInspectionDate?: string;
  nextInspectionDue?: string;
  activeGrievancesCount: number;
  supervisorOverrides: SupervisorOverride[];
  publicRecordNotice: string;
  safetyRecord?: BuildingSafetyRecord;
  maintenanceRecord?: BuildingMaintenanceRecord;
  isDemoFixture?: boolean;
  liveVideoEvidence?: LiveVideoEvidence;
}

export type GrievanceStatus =
  | "Submitted"
  | "Under Preliminary Review"
  | "Field Inspection Ordered"
  | "Resolved"
  | "Dismissed - Unsubstantiated";

export interface GrievanceRecord {
  id: string; // e.g. "GRV-2026-4412"
  buildingUid?: string;
  buildingName?: string;
  buildingAddress: string;
  zone: string;
  category:
    | "Setback Encroachment"
    | "Unauthorized Additional Floor"
    | "Blocked Fire Escape / Locked Exit"
    | "Structural Distress / Deep Cracks"
    | "Hazardous Material Storage"
    | "Illegal Commercial Conversion";
  description: string;
  evidenceMedia: {
    id: string;
    type: "photo" | "video";
    fileName: string;
    uploadedAt: string;
  }[];
  submittedAt: string;
  status: GrievanceStatus;
  dispositionNotes?: string;
  dispositionOfficer?: string;
  dispositionTimestamp?: string;
  confidentialNotice: string;
  isDemoFixture?: boolean;
}

export interface NoticeRecord {
  id: string;
  title: string;
  category: "Statutory Order" | "Safety Advisory" | "Notice of Violation" | "Platform Update";
  publishedDate: string;
  summary: string;
  issuingAuthority: string;
  isOfficialGazette: boolean;
  verificationSource?: string;
  isDemoFixture?: boolean;
}
