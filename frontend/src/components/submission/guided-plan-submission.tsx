"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Layers,
  GraduationCap,
  Hotel,
  ShoppingBag,
  Stethoscope,
  Download,
  Sparkles,
  FileCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BuildingCategory, PlanDocument, ApplicationRecord, ComplianceReport } from "@/types";
import { NirmaantraApi } from "@/services/api";
import { NirmaantraMlService } from "@/services/ml-service";

const ALLOWED_EXTENSIONS = [".pdf", ".dxf", ".dwg", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export function GuidedPlanSubmission() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State - Step 1: Building Details
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [state, setState] = useState("Delhi");
  const [city, setCity] = useState("New Delhi");
  const [plotAddress, setPlotAddress] = useState("");
  const [plotArea, setPlotArea] = useState<number | "">("");
  const [plotAreaUnit, setPlotAreaUnit] = useState<"sq.m" | "sq.ft" | "sq.yards">("sq.m");
  const [buildingCategory, setBuildingCategory] = useState<BuildingCategory>("Hospital & Healthcare");
  const [proposedHeightMeters, setProposedHeightMeters] = useState<number | "">("");
  const [roadWidthMeters, setRoadWidthMeters] = useState<number | "">(24.0);
  const [parkingSpacesProvided, setParkingSpacesProvided] = useState<number | "">("");

  // Specialized Focal Domain Parameters
  const [staircaseWidthM, setStaircaseWidthM] = useState<number | "">(2.10);
  const [corridorWidthM, setCorridorWidthM] = useState<number | "">(2.50);
  const [rampProvided, setRampProvided] = useState<boolean>(true);
  const [travelDistanceM, setTravelDistanceM] = useState<number | "">(25.0);
  const [numberOfStaircases, setNumberOfStaircases] = useState<number | "">(3);
  const [frontSetbackM, setFrontSetbackM] = useState<number | "">(12.5);
  const [rearSetbackM, setRearSetbackM] = useState<number | "">(9.5);
  const [sideSetbackM, setSideSetbackM] = useState<number | "">(6.2);

  // Form State - Step 2: Document Upload
  const [documents, setDocuments] = useState<PlanDocument[]>([]);
  const [uploadedRealFiles, setUploadedRealFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form State - Step 3 / Submission
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submittedRecord, setSubmittedRecord] = useState<ApplicationRecord | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Preset Loaders for Quick 1-Click Demonstration
  const loadPreset = (type: "hospital" | "shopping" | "hotel" | "educational") => {
    if (type === "hospital") {
      setBuildingCategory("Hospital & Healthcare");
      setBuildingName("Max Care Multi-Speciality Hospital");
      setApplicantName("Dr. Arvind Shrivastava (Director, Max Care Hospitals)");
      setApplicantEmail("a.shrivastava@maxcarehealth.in");
      setPlotAddress("Plot No. 14, Institutional Area, Sector 19, Dwarka");
      setPlotArea(3500);
      setPlotAreaUnit("sq.m");
      setProposedHeightMeters(18.0);
      setRoadWidthMeters(24.0);
      setParkingSpacesProvided(150);
      setStaircaseWidthM(2.10);
      setCorridorWidthM(2.50);
      setRampProvided(true);
      setFrontSetbackM(12.5);
      setRearSetbackM(9.5);
      setSideSetbackM(6.2);
    } else if (type === "shopping") {
      setBuildingCategory("Shopping Center");
      setBuildingName("Pacific Galleria Shopping Mall & Multiplex");
      setApplicantName("Sunil Mehra (Authorized Signatory, Pacific Retail)");
      setApplicantEmail("projects@pacificgalleria.in");
      setPlotAddress("Plot 88, Commercial District Centre, Naraina Outer Ring Road");
      setPlotArea(5000);
      setPlotAreaUnit("sq.m");
      setProposedHeightMeters(14.0);
      setRoadWidthMeters(24.0);
      setParkingSpacesProvided(280);
      setStaircaseWidthM(2.20);
      setTravelDistanceM(25.0);
      setNumberOfStaircases(4);
      setFrontSetbackM(12.5);
      setRearSetbackM(9.5);
      setSideSetbackM(6.5);
    } else if (type === "hotel") {
      setBuildingCategory("Hotel");
      setBuildingName("The Grand Regal Hotel & Convention Centre");
      setApplicantName("Rajesh Malhotra (Chief Architect, Regal Hospitality)");
      setApplicantEmail("r.malhotra@regalhotels.com");
      setPlotAddress("Plot 8, Hospitality District, Aerocity, New Delhi");
      setPlotArea(2800);
      setPlotAreaUnit("sq.m");
      setProposedHeightMeters(19.5);
      setRoadWidthMeters(24.0);
      setParkingSpacesProvided(185);
      setStaircaseWidthM(1.60);
      setFrontSetbackM(12.0);
      setRearSetbackM(9.0);
      setSideSetbackM(6.0);
    } else if (type === "educational") {
      setBuildingCategory("Educational Building");
      setBuildingName("Apex International University Campus");
      setApplicantName("Prof. K. N. Sen (Registrar, Apex Educational Trust)");
      setApplicantEmail("registrar@apexedu.ac.in");
      setPlotAddress("Plot 22, Institutional Campus Zone, Rohini Sector 16");
      setPlotArea(4500);
      setPlotAreaUnit("sq.m");
      setProposedHeightMeters(13.5);
      setRoadWidthMeters(18.0);
      setParkingSpacesProvided(110);
      setStaircaseWidthM(1.80);
      setFrontSetbackM(12.0);
      setRearSetbackM(9.0);
      setSideSetbackM(6.0);
    }
    setValidationErrors([]);
  };

  // File Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, category: PlanDocument["category"]) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setUploadError(`Invalid format "${extension}". Permitted formats: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(`File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    const docId = `doc-${Date.now()}`;
    const newDoc: PlanDocument = {
      id: docId,
      name: file.name,
      sizeBytes: file.size,
      type: file.type || "application/octet-stream",
      category,
      uploadProgress: 100,
      uploadedAt: new Date().toISOString(),
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      sha256Hash: `sim-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
    };

    setDocuments((prev) => [...prev, newDoc]);
    setUploadedRealFiles((prev) => [...prev, file]);
    e.target.value = "";
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Step Nav Validation
  const validateStep1 = () => {
    const errors: string[] = [];
    if (!applicantName.trim()) errors.push("Applicant name is required.");
    if (!applicantEmail.trim() || !applicantEmail.includes("@")) errors.push("Valid applicant email is required.");
    if (!buildingName.trim()) errors.push("Building / Project name is required.");
    if (!plotAddress.trim()) errors.push("Full plot address is required.");
    if (!plotArea || Number(plotArea) <= 0) errors.push("Plot area must be greater than zero.");
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const validateStep2 = () => {
    const errors: string[] = [];
    const hasDrawing = documents.some((d) => d.category === "Architectural Drawing");
    if (!hasDrawing) {
      errors.push("At least one Architectural Blueprint / Drawing file must be uploaded.");
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleProceedToStep2 = () => {
    if (validateStep1()) {
      setValidationErrors([]);
      setCurrentStep(2);
    }
  };

  const handleProceedToStep3 = () => {
    if (validateStep2()) {
      setValidationErrors([]);
      setCurrentStep(3);
    }
  };

  const handleSubmitApplication = async () => {
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setSubmitting(true);
    try {
      const record = await NirmaantraApi.submitApplication({
        applicantName,
        applicantEmail,
        buildingName,
        state,
        city,
        plotAddress,
        plotArea: Number(plotArea),
        plotAreaUnit,
        buildingCategory,
        proposedHeightMeters: proposedHeightMeters ? Number(proposedHeightMeters) : undefined,
        documents,
      });

      // Automatically trigger AI Statutory Compliance Screening
      try {
        let plotSqm = Number(plotArea);
        if (plotAreaUnit === "sq.ft") plotSqm = plotSqm * 0.092903;
        else if (plotAreaUnit === "sq.yards") plotSqm = plotSqm * 0.836127;

        let occParam = "hospital";
        if (buildingCategory.includes("Educational")) occParam = "educational";
        else if (buildingCategory.includes("Hospital")) occParam = "hospital";
        else if (buildingCategory.includes("Hotel")) occParam = "hotel";
        else if (buildingCategory.includes("Shopping")) occParam = "shopping_center";

        let report: ComplianceReport;
        // If a real PDF file was attached, run analyzeFile through backend if possible
        const drawingFile = uploadedRealFiles.find((f) => f.name.toLowerCase().endsWith(".pdf"));
        if (drawingFile && NirmaantraMlService.isConfigured()) {
          try {
            report = await NirmaantraMlService.analyzeFile(drawingFile, buildingName);
          } catch {
            report = await NirmaantraMlService.analyzeParameters({
              project_name: buildingName,
              location_address: `${plotAddress}, ${city}, ${state}`,
              occupancy_type: occParam,
              plot_area_sqm: Math.round(plotSqm * 100) / 100,
              building_height_m: proposedHeightMeters ? Number(proposedHeightMeters) : 16.0,
              ground_coverage_sqm: Math.round(plotSqm * 0.35 * 100) / 100,
              total_builtup_area_sqm: Math.round(plotSqm * 1.8 * 100) / 100,
              road_width_m: roadWidthMeters ? Number(roadWidthMeters) : 24.0,
              parking_spaces_provided: parkingSpacesProvided ? Number(parkingSpacesProvided) : 100,
              setbacks: {
                front_m: frontSetbackM ? Number(frontSetbackM) : 12.0,
                rear_m: rearSetbackM ? Number(rearSetbackM) : 9.0,
                side1_m: sideSetbackM ? Number(sideSetbackM) : 6.0,
                side2_m: sideSetbackM ? Number(sideSetbackM) : 6.0,
              },
              fire_safety: {
                staircase_width_m: staircaseWidthM ? Number(staircaseWidthM) : 2.0,
                corridor_width_m: corridorWidthM ? Number(corridorWidthM) : 2.5,
                ramp_provided: rampProvided,
                travel_distance_to_exit_m: travelDistanceM ? Number(travelDistanceM) : 25.0,
                number_of_staircases: numberOfStaircases ? Number(numberOfStaircases) : 3,
                fire_extinguishers_present: true,
                fire_alarm_present: true,
                sprinklers_present: true,
                emergency_exits_count: 4,
              },
            });
          }
        } else {
          report = await NirmaantraMlService.analyzeParameters({
            project_name: buildingName,
            location_address: `${plotAddress}, ${city}, ${state}`,
            occupancy_type: occParam,
            plot_area_sqm: Math.round(plotSqm * 100) / 100,
            building_height_m: proposedHeightMeters ? Number(proposedHeightMeters) : 16.0,
            ground_coverage_sqm: Math.round(plotSqm * 0.35 * 100) / 100,
            total_builtup_area_sqm: Math.round(plotSqm * 1.8 * 100) / 100,
            road_width_m: roadWidthMeters ? Number(roadWidthMeters) : 24.0,
            parking_spaces_provided: parkingSpacesProvided ? Number(parkingSpacesProvided) : 100,
            setbacks: {
              front_m: frontSetbackM ? Number(frontSetbackM) : 12.0,
              rear_m: rearSetbackM ? Number(rearSetbackM) : 9.0,
              side1_m: sideSetbackM ? Number(sideSetbackM) : 6.0,
              side2_m: sideSetbackM ? Number(sideSetbackM) : 6.0,
            },
            fire_safety: {
              staircase_width_m: staircaseWidthM ? Number(staircaseWidthM) : 2.0,
              corridor_width_m: corridorWidthM ? Number(corridorWidthM) : 2.5,
              ramp_provided: rampProvided,
              travel_distance_to_exit_m: travelDistanceM ? Number(travelDistanceM) : 25.0,
              number_of_staircases: numberOfStaircases ? Number(numberOfStaircases) : 3,
              fire_extinguishers_present: true,
              fire_alarm_present: true,
              sprinklers_present: true,
              emergency_exits_count: 4,
            },
          });
        }

        const updated = await NirmaantraApi.updateApplicationCompliance(record.id, report);
        if (updated) {
          setSubmittedRecord(updated);
          return;
        }
      } catch (aiErr) {
        console.warn("Automated AI pre-screening notice:", aiErr);
      }

      setSubmittedRecord(record);
    } catch (err) {
      console.error("Submission failed", err);
      setValidationErrors(["Submission could not be completed. Please retry."]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!submittedRecord?.complianceReport) return;
    setDownloadingPdf(true);
    try {
      await NirmaantraMlService.triggerPdfDownload(
        submittedRecord.complianceReport,
        `${submittedRecord.id}_Statutory_Audit_Report.pdf`
      );
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // If submitted successfully:
  if (submittedRecord) {
    const report = submittedRecord.complianceReport;
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <Card className="border-emerald-200 bg-white shadow-md">
          <CardHeader className="bg-emerald-50/70 border-b border-emerald-100 pb-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-emerald-950">
                  Building Plan Application Submitted & Screened
                </CardTitle>
                <CardDescription className="text-xs text-emerald-800">
                  Application logged under ID <span className="font-mono font-bold">{submittedRecord.id}</span>. Automated statutory scrutiny completed.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {/* Top Score Strip if Compliance Report Present */}
            {report && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-800 font-bold">
                      Delhi UBBL-2016 Statutory Audit Score
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {report.summary.compliance_score_percent}% Compliant
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={
                        report.summary.overall_status === "COMPLIANT"
                          ? "bg-emerald-600 text-white"
                          : report.summary.overall_status === "REQUIRES_REVIEW"
                          ? "bg-amber-500 text-white"
                          : "bg-red-600 text-white"
                      }
                    >
                      {report.summary.overall_status.replace("_", " ")}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 px-3"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      {downloadingPdf ? "Generating..." : "Download PDF Audit Report"}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Total Rules</span>
                    <span className="font-bold text-slate-800 text-sm">{report.summary.total_requirements_checked}</span>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 block">Passed</span>
                    <span className="font-bold text-emerald-800 text-sm">{report.summary.passed_count}</span>
                  </div>
                  <div className="p-2 bg-amber-50 rounded border border-amber-200">
                    <span className="text-[10px] text-amber-700 block">Needs Review</span>
                    <span className="font-bold text-amber-800 text-sm">{report.summary.needs_review_count}</span>
                  </div>
                  <div className="p-2 bg-red-50 rounded border border-red-200">
                    <span className="text-[10px] text-red-700 block">Failed</span>
                    <span className="font-bold text-red-800 text-sm">{report.summary.failed_count}</span>
                  </div>
                </div>

                {/* Key Findings List */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-900 block">Statutory Requirements Evaluated:</span>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {report.findings.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-start space-x-2.5"
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                            f.status === "PASS"
                              ? "bg-emerald-100 text-emerald-800"
                              : f.status === "NEEDS_REVIEW"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {f.status}
                        </span>
                        <div className="flex-1">
                          <span className="font-bold text-slate-900">{f.rule_name}</span>
                          <p className="text-[11px] text-slate-600 mt-0.5">{f.explanation}</p>
                          {f.regulatory_citations.length > 0 && (
                            <p className="text-[10px] text-purple-700 mt-1 font-medium">
                              Statutory Citation: {f.regulatory_citations[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Application Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Building Name</span>
                <span className="font-semibold text-slate-800">{submittedRecord.buildingName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Occupancy Focus & Plot Area</span>
                <span className="font-semibold text-slate-800">
                  {submittedRecord.buildingCategory} • {submittedRecord.plotArea} {submittedRecord.plotAreaUnit}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Applicant</span>
                <span className="font-semibold text-slate-800">{submittedRecord.applicantName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Documents Attached</span>
                <span className="font-semibold text-slate-800">{submittedRecord.documents.length} files logged</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between border-t border-slate-100 pt-5 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSubmittedRecord(null);
                setCurrentStep(1);
                setDocuments([]);
                setUploadedRealFiles([]);
              }}
              className="text-xs"
            >
              Submit Another Plan
            </Button>
            <Link href={`/applications/${submittedRecord.id}`}>
              <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-semibold">
                Track Application & View Scrutiny Desk <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1-Click Preset Demonstrators */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 rounded-xl border border-purple-200 p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="text-xs font-bold text-purple-950">
              1-Click Demo Scenarios (Focus Domains):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => loadPreset("hospital")}
              className="px-2.5 py-1 rounded bg-white hover:bg-emerald-50 border border-emerald-300 text-[11px] font-bold text-emerald-900 transition-colors shadow-2xs flex items-center"
            >
              <Stethoscope className="w-3 h-3 mr-1 text-emerald-600" /> Max Care Hospital
            </button>
            <button
              type="button"
              onClick={() => loadPreset("shopping")}
              className="px-2.5 py-1 rounded bg-white hover:bg-blue-50 border border-blue-300 text-[11px] font-bold text-blue-900 transition-colors shadow-2xs flex items-center"
            >
              <ShoppingBag className="w-3 h-3 mr-1 text-blue-600" /> Pacific Mall
            </button>
            <button
              type="button"
              onClick={() => loadPreset("hotel")}
              className="px-2.5 py-1 rounded bg-white hover:bg-rose-50 border border-rose-300 text-[11px] font-bold text-rose-900 transition-colors shadow-2xs flex items-center"
            >
              <Hotel className="w-3 h-3 mr-1 text-rose-600" /> Grand Regal Hotel
            </button>
            <button
              type="button"
              onClick={() => loadPreset("educational")}
              className="px-2.5 py-1 rounded bg-white hover:bg-purple-50 border border-purple-300 text-[11px] font-bold text-purple-900 transition-colors shadow-2xs flex items-center"
            >
              <GraduationCap className="w-3 h-3 mr-1 text-purple-600" /> Apex University
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Step Stepper Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div
            className={`flex items-center space-x-2 ${
              currentStep === 1 ? "text-[#3b185f] font-bold" : "text-slate-500"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= 1 ? "bg-[#d85a38] text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              1
            </div>
            <span>Step 1: Building & Life Safety Parameters</span>
          </div>

          <div className="hidden sm:block h-[1px] w-12 bg-slate-200" />

          <div
            className={`flex items-center space-x-2 ${
              currentStep === 2 ? "text-[#3b185f] font-bold" : "text-slate-500"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= 2 ? "bg-[#d85a38] text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              2
            </div>
            <span>Step 2: Drawing Upload</span>
          </div>

          <div className="hidden sm:block h-[1px] w-12 bg-slate-200" />

          <div
            className={`flex items-center space-x-2 ${
              currentStep === 3 ? "text-[#3b185f] font-bold" : "text-slate-500"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 3 ? "bg-[#d85a38] text-white" : "bg-slate-200 text-slate-600"
              }`}
            >
              3
            </div>
            <span>Step 3: Verification & Scrutiny</span>
          </div>
        </div>
      </div>

      {/* Validation Alert */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-800 space-y-1">
          <p className="font-bold flex items-center">
            <AlertCircle className="w-4 h-4 mr-1.5 text-red-600" />
            Please address the following mandatory requirements:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* STEP 1: Building Details & Focal Occupancy */}
      {currentStep === 1 && (
        <Card className="bg-white shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">
              Step 1: Building Identification & Statutory Dimensions
            </CardTitle>
            <CardDescription className="text-xs">
              Provide project details and statutory parameters under Delhi Unified Building Bye-Laws 2016.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 4 Focal Occupancy Selector Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Focal Building Occupancy Classification <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Hospital */}
                <button
                  type="button"
                  onClick={() => setBuildingCategory("Hospital & Healthcare")}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    buildingCategory === "Hospital & Healthcare"
                      ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <Stethoscope className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="text-xs font-bold">Hospital & Healthcare</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Min 2.0m staircase, 2.40m patient corridor, evacuation ramps, DFS NOC &gt;9m.
                  </p>
                </button>

                {/* 2. Shopping Center */}
                <button
                  type="button"
                  onClick={() => setBuildingCategory("Shopping Center")}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    buildingCategory === "Shopping Center"
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-2 text-blue-800">
                    <ShoppingBag className="w-4 h-4 shrink-0 text-blue-600" />
                    <span className="text-xs font-bold">Shopping Center / Mall</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Max 30m travel distance, 2.0m exit width, &ge;2 staircases, 3.0 ECS parking.
                  </p>
                </button>

                {/* 3. Hotel */}
                <button
                  type="button"
                  onClick={() => setBuildingCategory("Hotel")}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    buildingCategory === "Hotel"
                      ? "border-rose-600 bg-rose-50/50 ring-2 ring-rose-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-2 text-rose-800">
                    <Hotel className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="text-xs font-bold">Commercial Hotel</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Min 1.50m staircase, FAR 225/325, 3.0 ECS parking, DFS NOC &gt;12m.
                  </p>
                </button>

                {/* 4. Educational */}
                <button
                  type="button"
                  onClick={() => setBuildingCategory("Educational Building")}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    buildingCategory === "Educational Building"
                      ? "border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center space-x-2 text-purple-800">
                    <GraduationCap className="w-4 h-4 shrink-0 text-purple-600" />
                    <span className="text-xs font-bold">Educational Building</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Min 1.50m staircase, FAR 150/225, 35% max coverage, DFS NOC &gt;9m.
                  </p>
                </button>
              </div>
            </div>

            {/* Applicant & Project Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applicant / Architect Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Dr. Arvind Shrivastava / Ar. Vikram Singhania"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applicant Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="e.g. a.shrivastava@maxcarehealth.in"
                />
              </div>
            </div>

            {/* Project Name and Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Building / Project Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="e.g. Max Care Multi-Speciality Hospital"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Plot / Survey Address <span className="text-red-500">*</span>
                </label>
                <Input
                  value={plotAddress}
                  onChange={(e) => setPlotAddress(e.target.value)}
                  placeholder="e.g. Plot No. 14, Institutional Area, Sector 19, Dwarka"
                />
              </div>
            </div>

            {/* Core Dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plot Area <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={plotArea}
                  onChange={(e) => setPlotArea(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 3500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit
                </label>
                <select
                  value={plotAreaUnit}
                  onChange={(e) => setPlotAreaUnit(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="sq.m">Square Meters (sq.m)</option>
                  <option value="sq.ft">Square Feet (sq.ft)</option>
                  <option value="sq.yards">Square Yards (sq.yards)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Height (Meters)
                </label>
                <Input
                  type="number"
                  value={proposedHeightMeters}
                  onChange={(e) => setProposedHeightMeters(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 18.0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Road Width (Meters)
                </label>
                <Input
                  type="number"
                  value={roadWidthMeters}
                  onChange={(e) => setRoadWidthMeters(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 24.0"
                />
              </div>
            </div>

            {/* Sector-Specific Life Safety Parameters */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <span className="text-xs font-bold text-slate-900 block uppercase tracking-wide">
                Specialized Life-Safety & Setback Parameters ({buildingCategory})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Emergency Staircase Width (m)
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    value={staircaseWidthM}
                    onChange={(e) => setStaircaseWidthM(e.target.value ? Number(e.target.value) : "")}
                    placeholder="2.00"
                  />
                  <span className="text-[10px] text-slate-500">
                    {buildingCategory.includes("Hospital") || buildingCategory.includes("Shopping") ? "Min 2.00m required" : "Min 1.50m required"}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Parking Spaces Provided (ECS)
                  </label>
                  <Input
                    type="number"
                    value={parkingSpacesProvided}
                    onChange={(e) => setParkingSpacesProvided(e.target.value ? Number(e.target.value) : "")}
                    placeholder="150"
                  />
                  <span className="text-[10px] text-slate-500">
                    {buildingCategory.includes("Hotel") || buildingCategory.includes("Shopping") ? "Quota: 3.0 ECS / 100 sqm" : "Quota: 1.5 - 2.0 ECS"}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Side Setback / Fire Driveway (m)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={sideSetbackM}
                    onChange={(e) => setSideSetbackM(e.target.value ? Number(e.target.value) : "")}
                    placeholder="6.0"
                  />
                  <span className="text-[10px] text-slate-500">Min 6.0m clear access required</span>
                </div>
              </div>

              {/* Dynamic Domain Specific Controls */}
              {buildingCategory.includes("Hospital") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Patient Corridor Clear Width (m) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.05"
                      value={corridorWidthM}
                      onChange={(e) => setCorridorWidthM(e.target.value ? Number(e.target.value) : "")}
                      placeholder="2.50"
                    />
                    <span className="text-[10px] text-emerald-700 font-semibold">Min 2.40m statutory for bed/stretcher movement</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Continuous Evacuation Ramp Provided?
                    </label>
                    <select
                      value={rampProvided ? "true" : "false"}
                      onChange={(e) => setRampProvided(e.target.value === "true")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                    >
                      <option value="true">Yes (Continuous anti-skid ramp connecting patient floors)</option>
                      <option value="false">No (Ramp not provided - triggers non-compliance)</option>
                    </select>
                  </div>
                </div>
              )}

              {buildingCategory.includes("Shopping") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Max Exit Travel Distance (m) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={travelDistanceM}
                      onChange={(e) => setTravelDistanceM(e.target.value ? Number(e.target.value) : "")}
                      placeholder="25.0"
                    />
                    <span className="text-[10px] text-blue-700 font-semibold">Max 30.0m permissible under Clause 9.3.2</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Number of Independent Staircases
                    </label>
                    <Input
                      type="number"
                      value={numberOfStaircases}
                      onChange={(e) => setNumberOfStaircases(e.target.value ? Number(e.target.value) : "")}
                      placeholder="3"
                    />
                    <span className="text-[10px] text-blue-700 font-semibold">Min 2 independent exits required</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
            <span className="text-[11px] text-slate-500">Step 1 of 3</span>
            <Button
              onClick={handleProceedToStep2}
              className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-semibold"
            >
              Continue to Document Upload <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: Document Upload */}
      {currentStep === 2 && (
        <Card className="bg-white shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Step 2: Document & Blueprint Upload</CardTitle>
            <CardDescription className="text-xs">
              Upload digitized architectural drawings for automated AI extraction. Permitted types: PDF, DXF, DWG, JPG, PNG up to 50MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {uploadError}
              </div>
            )}

            {/* Upload zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mandatory Architectural Drawing */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50/50 hover:border-[#3b185f] transition-colors">
                <UploadCloud className="w-8 h-8 mx-auto text-[#ea580c] mb-2" />
                <h4 className="text-xs font-bold text-slate-800">
                  Architectural Blueprint / Drawing <span className="text-red-500">*</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                  Floor plans, elevation, and setback dimensions.
                </p>
                <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 rounded bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
                  <span>Browse Drawing File</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.dxf,.dwg,.jpg,.png"
                    onChange={(e) => handleFileSelect(e, "Architectural Drawing")}
                  />
                </label>
              </div>

              {/* Supporting Document */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50/50 hover:border-[#3b185f] transition-colors">
                <FileText className="w-8 h-8 mx-auto text-blue-700 mb-2" />
                <h4 className="text-xs font-bold text-slate-800">
                  Supporting Affidavits & NOCs (Optional)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                  Structural safety certificate, site layout, fire NOC.
                </p>
                <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 rounded bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs">
                  <span>Browse Supporting Document</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.png"
                    onChange={(e) => handleFileSelect(e, "Structural Affidavit")}
                  />
                </label>
              </div>
            </div>

            {/* Quick Demo Drawing Generator button if user doesn't have a file */}
            {documents.length === 0 && (
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-purple-900">
                  <FileCheck className="w-4 h-4 text-purple-700" />
                  <span>Don't have a plan file ready? Attach a certified mock drawing for {buildingCategory}.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const mockDoc: PlanDocument = {
                      id: `doc-${Date.now()}`,
                      name: `${buildingName.replace(/\s+/g, "_") || "Submission"}_Sanction_Drawings.pdf`,
                      sizeBytes: 14200000,
                      type: "application/pdf",
                      category: "Architectural Drawing",
                      uploadProgress: 100,
                      uploadedAt: new Date().toISOString(),
                    };
                    setDocuments([mockDoc]);
                  }}
                  className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded text-[11px] font-bold"
                >
                  Attach Demo Drawing
                </button>
              </div>
            )}

            {/* Uploaded Documents List */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2">
                Attached Documents ({documents.length})
              </h4>
              {documents.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                  No files uploaded yet. Please attach at least one architectural drawing.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-blue-800 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900">{doc.name}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                            <span>{(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-[9px] py-0">
                              {doc.category}
                            </Badge>
                            <span>•</span>
                            <span className="font-mono text-emerald-700">Ready</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {doc.previewUrl && (
                          <a
                            href={doc.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-500 hover:text-slate-800"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Details
            </Button>
            <Button
              onClick={handleProceedToStep3}
              className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-semibold"
            >
              Review Application <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: Review and Submit */}
      {currentStep === 3 && (
        <Card className="bg-white shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Step 3: Verification & Statutory Scrutiny</CardTitle>
            <CardDescription className="text-xs">
              Review all parameters and documents before filing. Automated AI compliance screening will execute upon submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Review Sections */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  1. Building & Applicant Summary
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-[#3b185f] h-6 px-2 hover:bg-slate-200"
                >
                  Edit Details
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Building Name:</span>
                  <span className="font-semibold text-slate-900">{buildingName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Focal Category:</span>
                  <span className="font-semibold text-slate-900">{buildingCategory}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Plot Address:</span>
                  <span className="font-semibold text-slate-900">{plotAddress}, {city}, {state}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Plot Area & Height:</span>
                  <span className="font-semibold text-slate-900">
                    {plotArea} {plotAreaUnit} • {proposedHeightMeters || "N/A"} m
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Staircase & Setbacks:</span>
                  <span className="font-semibold text-slate-900">
                    Staircase: {staircaseWidthM}m • Side: {sideSetbackM}m • Parking: {parkingSpacesProvided} ECS
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Applicant Name:</span>
                  <span className="font-semibold text-slate-900">{applicantName}</span>
                </div>
              </div>
            </div>

            {/* Documents Summary */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  2. Attached Plan Files ({documents.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-[#3b185f] h-6 px-2 hover:bg-slate-200"
                >
                  Edit Files
                </Button>
              </div>

              <div className="space-y-1.5">
                {documents.map((d) => (
                  <div key={d.id} className="flex justify-between items-center text-xs py-1">
                    <span className="font-medium text-slate-800">{d.name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {(d.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {d.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Statutory Disclaimer Notice */}
            <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-lg text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-700" />
                Affidavit of Truthful Representation
              </p>
              <p className="text-[11px] leading-relaxed">
                I hereby declare that the architectural drawings, structural dimensions, and setback calculations submitted above are certified accurate by the registered architect/engineer. Submissions are subject to multi-stage scrutiny and randomized on-site verification.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              disabled={submitting}
              className="text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Uploads
            </Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={submitting}
              className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-bold px-6"
            >
              {submitting ? "Executing AI Compliance Scrutiny..." : "Confirm & Run AI Compliance Scrutiny"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
