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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BuildingCategory, PlanDocument, ApplicationRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";

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
  const [buildingCategory, setBuildingCategory] = useState<BuildingCategory>("Commercial");
  const [proposedHeightMeters, setProposedHeightMeters] = useState<number | "">("");

  // Form State - Step 2: Document Upload
  const [documents, setDocuments] = useState<PlanDocument[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form State - Step 3 / Submission
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submittedRecord, setSubmittedRecord] = useState<ApplicationRecord | null>(null);

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
    // Reset file input
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

      setSubmittedRecord(record);
    } catch (err) {
      console.error("Submission failed", err);
      setValidationErrors(["Submission could not be completed. Please retry."]);
    } finally {
      setSubmitting(false);
    }
  };

  // If submitted successfully:
  if (submittedRecord) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card className="border-emerald-200 bg-white shadow-md">
          <CardHeader className="bg-emerald-50/70 border-b border-emerald-100 pb-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-emerald-950">
                  Building Plan Application Submitted
                </CardTitle>
                <CardDescription className="text-xs text-emerald-800">
                  Submission successfully logged into Nirmaantra compliance registry.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Reference Box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-mono tracking-wider">
                  Official Application Reference ID
                </span>
                <p className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                  {submittedRecord.id}
                </p>
              </div>
              <Badge variant="outline" className="text-xs bg-white text-slate-700 h-7 px-3">
                Status: {submittedRecord.status}
              </Badge>
            </div>

            {/* Anti-fabrication & Policy Notice */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 text-xs text-slate-700 space-y-1.5">
              <p className="font-bold text-blue-950 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-blue-700" />
                Statutory Human Review Policy Window
              </p>
              <p>
                As per municipal policy, the proposed review turnaround is <strong>3 to 4 business days</strong>.
                Authorized supervisor allocation is currently being registered.
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                Note on AI Screening: ML model endpoint is maintained by teammate. No automated scores or certificates are fabricated without live verification.
              </p>
            </div>

            {/* Application Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Building Name</span>
                <span className="font-semibold text-slate-800">{submittedRecord.buildingName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Category & Plot Area</span>
                <span className="font-semibold text-slate-800">
                  {submittedRecord.buildingCategory} • {submittedRecord.plotArea} {submittedRecord.plotAreaUnit}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Applicant</span>
                <span className="font-semibold text-slate-800">{submittedRecord.applicantName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Documents Uploaded</span>
                <span className="font-semibold text-slate-800">{submittedRecord.documents.length} files attached</span>
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
              }}
              className="text-xs"
            >
              Submit Another Plan
            </Button>
            <Link href={`/applications/${submittedRecord.id}`}>
              <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-semibold">
                Track Application & View Review Desk <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <span>Step 1: Building Details</span>
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
            <span>Step 2: Document Upload</span>
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
            <span>Step 3: Review & Submit</span>
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

      {/* STEP 1: Building Details */}
      {currentStep === 1 && (
        <Card className="bg-white shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Step 1: Applicant & Building Details</CardTitle>
            <CardDescription className="text-xs">
              Provide project jurisdiction, location, and structural parameters. Prioritizing commercial complexes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applicant / Registered Architect Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Ar. Vikram Singhania (CA/2012/5541)"
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
                  placeholder="e.g. v.singhania@apexdesign.in"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Building / Project Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="e.g. Apex Heights Commercial Complex"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Building Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={buildingCategory}
                  onChange={(e) => setBuildingCategory(e.target.value as BuildingCategory)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b185f]"
                >
                  <option value="Commercial">Commercial (Group E - Retail, Offices, IT Parks)</option>
                  <option value="Residential">Residential (Group A - Apartments, Housing)</option>
                  <option value="Institutional">Institutional (Group B - Hospitals, Educational)</option>
                  <option value="Industrial">Industrial (Group G - Factories, Warehouses)</option>
                  <option value="Assembly">Assembly (Group D - Theaters, Convention Halls)</option>
                  <option value="Hazardous">Hazardous (Group J)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / Territory
                </label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Jurisdiction
                </label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Height (Meters)
                </label>
                <Input
                  type="number"
                  value={proposedHeightMeters}
                  onChange={(e) => setProposedHeightMeters(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 28.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Plot / Survey Address <span className="text-red-500">*</span>
              </label>
              <Input
                value={plotAddress}
                onChange={(e) => setPlotAddress(e.target.value)}
                placeholder="e.g. Plot 14-B, Sector 7-C, Indiranagar Commercial Belt"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plot Area <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={plotArea}
                  onChange={(e) => setPlotArea(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 2450"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plot Area Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={plotAreaUnit}
                  onChange={(e) => setPlotAreaUnit(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3b185f]"
                >
                  <option value="sq.m">Square Meters (sq.m)</option>
                  <option value="sq.ft">Square Feet (sq.ft)</option>
                  <option value="sq.yards">Square Yards (sq.yards)</option>
                </select>
              </div>
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
              Upload digitized architectural drawings and statutory affidavits. Permitted types: PDF, DXF, DWG, JPG, PNG up to 50MB.
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
            <CardTitle className="text-base text-slate-900">Step 3: Verification & Submission</CardTitle>
            <CardDescription className="text-xs">
              Review all parameters and documents before filing. You may return to prior steps to make corrections.
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
                  <span className="text-slate-500 block text-[11px]">Category:</span>
                  <span className="font-semibold text-slate-900">{buildingCategory}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Plot Address:</span>
                  <span className="font-semibold text-slate-900">{plotAddress}, {city}, {state}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Plot Area:</span>
                  <span className="font-semibold text-slate-900">{plotArea} {plotAreaUnit}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Applicant Name:</span>
                  <span className="font-semibold text-slate-900">{applicantName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Applicant Email:</span>
                  <span className="font-semibold text-slate-900">{applicantEmail}</span>
                </div>
              </div>
            </div>

            {/* Documents Summary */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  2. Uploaded Plan Files ({documents.length})
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
              {submitting ? "Transmitting Submission..." : "Confirm & Submit Application"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
