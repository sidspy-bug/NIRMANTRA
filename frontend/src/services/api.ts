import {
  ApplicationRecord,
  BuildingRecord,
  InspectionRecord,
  GrievanceRecord,
  NoticeRecord,
  SupervisorOverride,
  ComplianceReport,
  LiveVideoEvidence,
} from "@/types";
import {
  DEMO_APPLICATIONS,
  DEMO_BUILDINGS,
  DEMO_INSPECTIONS,
  DEMO_GRIEVANCES,
  DEMO_NOTICES,
} from "@/data/demo-fixtures";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const STORAGE_KEYS = {
  APPLICATIONS: "nirmaantra_applications",
  INSPECTIONS: "nirmaantra_inspections",
  BUILDINGS: "nirmaantra_buildings",
  GRIEVANCES: "nirmaantra_grievances",
  NOTICES: "nirmaantra_notices",
};

function getLocalStore<T extends { id?: string; uid?: string }>(key: string, initial: T[]): T[] {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed: T[] = JSON.parse(raw);
    const initialMap = new Map(initial.map((item) => [item.id || item.uid, item]));
    let hasUpdates = false;

    // Merge missing items
    const existingKeys = new Set(parsed.map((item) => item.id || item.uid));
    const missing = initial.filter((item) => !existingKeys.has(item.id || item.uid));
    if (missing.length > 0) hasUpdates = true;

    // Also enrich existing items if initial has newer fields (e.g. safetyRecord, maintenanceRecord)
    const merged = parsed.map((item) => {
      const keyId = item.id || item.uid;
      const initItem = keyId ? initialMap.get(keyId) : undefined;
      if (initItem) {
        let changed = false;
        const copy: T = { ...item };
        for (const prop of Object.keys(initItem) as (keyof T)[]) {
          if (copy[prop] === undefined || (prop === "safetyRecord" && !(copy as any).safetyRecord)) {
            copy[prop] = initItem[prop];
            changed = true;
          }
        }
        if (changed) {
          hasUpdates = true;
          return copy;
        }
      }
      return item;
    });

    const finalResult = [...merged, ...missing];
    if (hasUpdates) {
      localStorage.setItem(key, JSON.stringify(finalResult));
    }
    return finalResult;
  } catch {
    return initial;
  }
}

function setLocalStore<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn("Local storage write failed:", err);
  }
}

export const NirmaantraApi = {
  isBackendConnected(): boolean {
    return Boolean(API_BASE && API_BASE.trim().length > 0);
  },

  getBackendUrl(): string {
    return API_BASE || "Not configured (Local Demonstration Store Active)";
  },

  // 1. Applications
  async getApplications(): Promise<ApplicationRecord[]> {
    if (this.isBackendConnected()) {
      try {
        const res = await fetch(`${API_BASE}/applications`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("Backend fetch failed, falling back to local store", e);
      }
    }
    return getLocalStore<ApplicationRecord>(STORAGE_KEYS.APPLICATIONS, DEMO_APPLICATIONS);
  },

  async getApplicationById(id: string): Promise<ApplicationRecord | null> {
    const apps = await this.getApplications();
    return apps.find((a) => a.id.toLowerCase() === id.toLowerCase()) || null;
  },

  async submitApplication(
    newApp: Omit<ApplicationRecord, "id" | "submittedAt" | "status" | "statusRemarks" | "mlScreeningStatus">
  ): Promise<ApplicationRecord> {
    const generatedId = `BLD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const fullApp: ApplicationRecord = {
      ...newApp,
      id: generatedId,
      submittedAt: new Date().toISOString(),
      status: "Submitted",
      statusRemarks:
        "Submission received. Queued for AI compliance screening pipeline and municipal supervisor allocation.",
      mlScreeningStatus: "Model Integration Pending",
      mlFindings: {
        modelAvailable: false,
        notice:
          "AI screening engine integration is pending ML model deployment by teammate. No automated scores or pass/fail determinations have been fabricated.",
      },
      humanReviewDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      isDemoFixture: !this.isBackendConnected(),
    };

    if (this.isBackendConnected()) {
      try {
        const res = await fetch(`${API_BASE}/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullApp),
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("Backend submit failed, falling back to local store", e);
      }
    }

    const current = getLocalStore<ApplicationRecord>(STORAGE_KEYS.APPLICATIONS, DEMO_APPLICATIONS);
    const updated = [fullApp, ...current];
    setLocalStore(STORAGE_KEYS.APPLICATIONS, updated);
    return fullApp;
  },

  async recordSupervisorReview(
    appId: string,
    decision: "Approved" | "Rejected",
    reviewerName: string,
    reason?: string,
    override?: {
      originalFinding: string;
      writtenJustification: string;
      evidenceUrls?: string[];
    }
  ): Promise<ApplicationRecord | null> {
    const apps = await this.getApplications();
    const app = apps.find((a) => a.id.toLowerCase() === appId.toLowerCase());
    if (!app) return null;

    app.status = decision;
    app.statusRemarks =
      decision === "Approved"
        ? "Application approved by municipal supervisor. Conditional on verified field inspection."
        : `Application rejected by municipal supervisor. Reason: ${reason || "Unspecified"}`;

    app.supervisorDecision = {
      decidedBy: reviewerName,
      decidedAt: new Date().toISOString(),
      decision,
      reason,
    };

    if (override) {
      const overrideRecord: SupervisorOverride = {
        overrideId: `OVR-${Math.floor(1000 + Math.random() * 9000)}`,
        reviewerId: "SUP-REVIEWER",
        reviewerName,
        reviewerRole: "Authorized Municipal Supervisor",
        timestamp: new Date().toISOString(),
        originalFinding: override.originalFinding,
        decision,
        writtenJustification: override.writtenJustification,
        supportingEvidenceUrls: override.evidenceUrls,
        publiclyDisclosed: true,
      };
      app.supervisorOverride = overrideRecord;
    }

    const updated = apps.map((a) => (a.id === app.id ? app : a));
    setLocalStore(STORAGE_KEYS.APPLICATIONS, updated);
    return app;
  },

  async updateApplicationCompliance(
    appId: string,
    report: ComplianceReport
  ): Promise<ApplicationRecord | null> {
    const apps = await this.getApplications();
    const app = apps.find((a) => a.id.toLowerCase() === appId.toLowerCase());
    if (!app) return null;

    app.complianceReport = report;
    app.mlScreeningStatus = "Completed";
    const statusText = report.summary.overall_status === "COMPLIANT" 
      ? "Fully Compliant" 
      : report.summary.overall_status === "NON_COMPLIANT" 
      ? "Statutory Violations Detected" 
      : "Human Architect Review Required";

    app.mlFindings = {
      modelAvailable: true,
      notice: `AI Compliance Scrutiny completed: ${statusText}. Score: ${report.summary.compliance_score_percent}% (${report.summary.passed_count}/${report.summary.total_requirements_checked} provisions passed).`,
      details: `${report.findings.length} statutory checks evaluated against Delhi UBBL-2016 and DFS Act.`,
    };

    if (report.summary.overall_status === "COMPLIANT") {
      app.statusRemarks = "Automated statutory screening passed. Queued for final municipal supervisor sign-off.";
    } else if (report.summary.overall_status === "NON_COMPLIANT") {
      app.statusRemarks = `Automated screening identified ${report.summary.failed_count} violation(s). Revisions required before permit issuance.`;
    }

    const updated = apps.map((a) => (a.id === app.id ? app : a));
    setLocalStore(STORAGE_KEYS.APPLICATIONS, updated);
    return app;
  },

  // 2. Inspections
  async getInspections(): Promise<InspectionRecord[]> {
    if (this.isBackendConnected()) {
      try {
        const res = await fetch(`${API_BASE}/inspections`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("Backend fetch failed, falling back to local store", e);
      }
    }
    return getLocalStore<InspectionRecord>(STORAGE_KEYS.INSPECTIONS, DEMO_INSPECTIONS);
  },

  async getInspectionById(id: string): Promise<InspectionRecord | null> {
    const list = await this.getInspections();
    return list.find((i) => i.id.toLowerCase() === id.toLowerCase()) || null;
  },

  async saveInspectionVisit(
    inspectionId: string,
    photos: InspectionRecord["photos"],
    observations: string,
    markCompleted: boolean = false,
    liveVideo?: LiveVideoEvidence
  ): Promise<InspectionRecord | null> {
    const list = await this.getInspections();
    const insp = list.find((i) => i.id.toLowerCase() === inspectionId.toLowerCase());
    if (!insp) return null;

    insp.photos = photos;
    insp.inspectorObservations = observations;
    if (liveVideo) {
      insp.liveVideoEvidence = liveVideo;
    }
    if (markCompleted) {
      insp.status = "Completed";
      insp.completedAt = new Date().toISOString();
    }

    const updated = list.map((i) => (i.id === insp.id ? insp : i));
    setLocalStore(STORAGE_KEYS.INSPECTIONS, updated);

    // Also persist live video directly to linked building UID record
    if (liveVideo && insp.buildingUid) {
      const buildings = await this.getBuildings();
      const bld = buildings.find((b) => b.uid.toLowerCase() === insp.buildingUid.toLowerCase());
      if (bld) {
        bld.liveVideoEvidence = liveVideo;
        const updatedBlds = buildings.map((b) => (b.uid === bld.uid ? b : b));
        setLocalStore(STORAGE_KEYS.BUILDINGS, updatedBlds);
      }
    }

    return insp;
  },

  // 3. Buildings
  async getBuildings(): Promise<BuildingRecord[]> {
    if (this.isBackendConnected()) {
      try {
        const res = await fetch(`${API_BASE}/buildings`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("Backend fetch failed, falling back to local store", e);
      }
    }
    return getLocalStore<BuildingRecord>(STORAGE_KEYS.BUILDINGS, DEMO_BUILDINGS);
  },

  async getBuildingByUid(uid: string): Promise<BuildingRecord | null> {
    const list = await this.getBuildings();
    return list.find((b) => b.uid.toLowerCase() === uid.toLowerCase()) || null;
  },

  // 4. Grievances
  async getGrievances(): Promise<GrievanceRecord[]> {
    if (this.isBackendConnected()) {
      try {
        const res = await fetch(`${API_BASE}/grievances`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn("Backend fetch failed, falling back to local store", e);
      }
    }
    return getLocalStore<GrievanceRecord>(STORAGE_KEYS.GRIEVANCES, DEMO_GRIEVANCES);
  },

  async getGrievanceById(id: string): Promise<GrievanceRecord | null> {
    const list = await this.getGrievances();
    return list.find((g) => g.id.toLowerCase() === id.toLowerCase()) || null;
  },

  async submitGrievance(
    data: Omit<GrievanceRecord, "id" | "submittedAt" | "status" | "confidentialNotice">
  ): Promise<GrievanceRecord> {
    const generatedId = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullGrievance: GrievanceRecord = {
      ...data,
      id: generatedId,
      submittedAt: new Date().toISOString(),
      status: "Submitted",
      confidentialNotice:
        "Complainant identity is held strictly confidential under citizen oversight guidelines. Not an official court indictment.",
      isDemoFixture: !this.isBackendConnected(),
    };

    const current = getLocalStore<GrievanceRecord>(STORAGE_KEYS.GRIEVANCES, DEMO_GRIEVANCES);
    const updated = [fullGrievance, ...current];
    setLocalStore(STORAGE_KEYS.GRIEVANCES, updated);
    return fullGrievance;
  },

  async updateGrievanceDisposition(
    id: string,
    status: GrievanceRecord["status"],
    officer: string,
    notes: string
  ): Promise<GrievanceRecord | null> {
    const list = await this.getGrievances();
    const grv = list.find((g) => g.id.toLowerCase() === id.toLowerCase());
    if (!grv) return null;

    grv.status = status;
    grv.dispositionOfficer = officer;
    grv.dispositionNotes = notes;
    grv.dispositionTimestamp = new Date().toISOString();

    const updated = list.map((g) => (g.id === grv.id ? grv : g));
    setLocalStore(STORAGE_KEYS.GRIEVANCES, updated);
    return grv;
  },

  // 5. Notices
  async getNotices(): Promise<NoticeRecord[]> {
    return DEMO_NOTICES;
  },
};
