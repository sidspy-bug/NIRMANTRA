export interface MlServiceStatus {
  isConfigured: boolean;
  endpointUrl: string;
  statusLabel: "AI screening integration pending" | "Awaiting AI analysis" | "Online";
  message: string;
}

const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || "";

export const NirmaantraMlService = {
  isConfigured(): boolean {
    return Boolean(ML_SERVICE_URL && ML_SERVICE_URL.trim().length > 0);
  },

  getStatus(): MlServiceStatus {
    if (this.isConfigured()) {
      return {
        isConfigured: true,
        endpointUrl: ML_SERVICE_URL,
        statusLabel: "Online",
        message: "Teammate ML screening microservice connected.",
      };
    }
    return {
      isConfigured: false,
      endpointUrl: "Unset",
      statusLabel: "AI screening integration pending",
      message:
        "The computer vision and building compliance ML models are being developed by a separate teammate. No automated regulatory scores or pass/fail determinations are fabricated.",
    };
  },

  async runDocumentScrutiny(documentId: string): Promise<{
    available: boolean;
    notice: string;
  }> {
    if (!this.isConfigured()) {
      return {
        available: false,
        notice:
          "AI screening engine integration is currently pending ML model deployment by teammate. No automated scores or pass/fail determinations have been fabricated.",
      };
    }

    try {
      const res = await fetch(`${ML_SERVICE_URL}/scrutiny/${documentId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("ML model service call failed:", e);
    }

    return {
      available: false,
      notice: "Awaiting AI analysis. Endpoint currently unreachable.",
    };
  },

  async runInspectionPhotoAnalysis(inspectionId: string): Promise<{
    available: boolean;
    notice: string;
  }> {
    return {
      available: false,
      notice:
        "Inspection image analysis ML pipeline is pending model deployment. Inspector observations represent certified manual inspection only.",
    };
  },
};
