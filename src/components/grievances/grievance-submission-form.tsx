"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MessageSquareWarning,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ArrowRight,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GrievanceRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";

export function GrievanceSubmissionForm() {
  const searchParams = useSearchParams();
  const prefillUid = searchParams.get("buildingUid") || "";

  const [buildingUid, setBuildingUid] = useState(prefillUid);
  const [buildingName, setBuildingName] = useState("");
  const [buildingAddress, setBuildingAddress] = useState("");
  const [zone, setZone] = useState("Central Zone");
  const [category, setCategory] = useState<GrievanceRecord["category"]>("Blocked Fire Escape / Locked Exit");
  const [description, setDescription] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<{ id: string; type: "photo" | "video"; fileName: string; uploadedAt: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<GrievanceRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If UID is prefilled, attempt to look up the building name
  useEffect(() => {
    if (prefillUid) {
      NirmaantraApi.getBuildingByUid(prefillUid).then((b) => {
        if (b) {
          setBuildingName(b.buildingName);
          setBuildingAddress(b.address);
          setZone(b.zone);
        }
      });
    }
  }, [prefillUid]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const isVideo = file.type.startsWith("video/");
    const newMedia = {
      id: `ev-${Date.now()}`,
      type: isVideo ? ("video" as const) : ("photo" as const),
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
    };

    setEvidenceFiles((prev) => [...prev, newMedia]);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!buildingAddress.trim()) {
      setErrorMsg("Property address or location is required.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Detailed description of the suspected safety violation is required.");
      return;
    }

    setSubmitting(true);
    try {
      const rec = await NirmaantraApi.submitGrievance({
        buildingUid: buildingUid.trim() || undefined,
        buildingName: buildingName.trim() || undefined,
        buildingAddress,
        zone,
        category,
        description,
        evidenceMedia: evidenceFiles,
      });

      setSubmittedRecord(rec);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to record grievance. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRecord) {
    return (
      <Card className="max-w-2xl mx-auto border-emerald-200 bg-white shadow-md">
        <CardHeader className="bg-emerald-50/70 border-b border-emerald-100 pb-4">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <div>
              <CardTitle className="text-lg text-emerald-950">
                Grievance Successfully Registered
              </CardTitle>
              <CardDescription className="text-xs text-emerald-800">
                Your report has been logged and assigned an official tracking token.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-mono">
              Grievance Reference Token
            </span>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
              {submittedRecord.id}
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              Initial Status: <strong>{submittedRecord.status}</strong>
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 space-y-1">
            <p className="font-bold flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-amber-700" /> Whistleblower Protection Policy
            </p>
            <p className="text-[11px] leading-relaxed">
              In strict compliance with transparency standards, allegations are treated objectively and not as pre-judged violations. Private informant details are withheld from public logs.
            </p>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link href="/grievances">
              <Button variant="outline" size="sm" className="text-xs">
                View Grievances Register
              </Button>
            </Link>
            <Link href={`/grievances/${submittedRecord.id}`}>
              <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-semibold">
                Track Grievance Disposition <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto bg-white shadow-2xs">
      <CardHeader>
        <CardTitle className="text-base font-bold text-slate-900">
          File Citizen Building Safety Grievance
        </CardTitle>
        <CardDescription className="text-xs">
          Report suspected setback deviations, illegal additional floors, locked fire corridors, or hazardous structural cracks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Building UID (If Available)
              </label>
              <Input
                value={buildingUid}
                onChange={(e) => setBuildingUid(e.target.value)}
                placeholder="e.g. NB-DL-2025-104 (optional)"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Building / Complex Name
              </label>
              <Input
                value={buildingName}
                onChange={(e) => setBuildingName(e.target.value)}
                placeholder="e.g. Galaxy Mercantile Plaza"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Suspected Violation Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-10 rounded border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="Blocked Fire Escape / Locked Exit">
                  Blocked Fire Escape / Locked Emergency Exit
                </option>
                <option value="Setback Encroachment">
                  Setback Encroachment / Driveway Obstruction
                </option>
                <option value="Unauthorized Additional Floor">
                  Unauthorized Additional Floor / Construction
                </option>
                <option value="Structural Distress / Deep Cracks">
                  Structural Distress / Visible Concrete Cracks
                </option>
                <option value="Hazardous Material Storage">
                  Hazardous / Combustible Storage in Basements
                </option>
                <option value="Illegal Commercial Conversion">
                  Illegal Commercial Conversion in Residential Zone
                </option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Municipal Zone
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full h-10 rounded border border-input bg-background px-3 py-2 text-xs"
              >
                <option>Central Zone</option>
                <option>South-East Zone</option>
                <option>North-West Zone</option>
                <option>West Zone</option>
                <option>East Zone</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Exact Property Location / Address <span className="text-red-500">*</span>
            </label>
            <Input
              value={buildingAddress}
              onChange={(e) => setBuildingAddress(e.target.value)}
              placeholder="e.g. Block C-2, Outer Ring Road, Naraina Industrial Area"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Detailed Description of Violation <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the nature of the hazard, specific floor numbers, whether emergency doors are padlocked, or observable structural damage..."
              className="w-full rounded border border-input p-3 text-xs"
              required
            />
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Supporting Photo / Video Evidence
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50/50 hover:border-[#3b185f] transition-colors">
              <Upload className="w-7 h-7 mx-auto text-slate-400 mb-1" />
              <p className="text-xs font-semibold text-slate-800">
                Attach site photographs or video clips
              </p>
              <p className="text-[10px] text-slate-500 mb-3">
                Geotagged photos of padlocked doors, structural cracks, or driveway blockages.
              </p>
              <label className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded bg-white border border-slate-300 text-xs font-semibold hover:bg-slate-50 shadow-2xs">
                <span>Select Evidence File</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* List attached evidence */}
            {evidenceFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {evidenceFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-200 text-[11px]"
                  >
                    <span className="font-medium text-slate-800">
                      {f.type.toUpperCase()}: {f.fileName}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEvidenceFiles((prev) => prev.filter((x) => x.id !== f.id))
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600">
            <strong>Citizen Whistleblower Notice:</strong> Submitting a grievance does not automatically brand a property as an illegal structure. All claims undergo preliminary statutory review and physical officer inspection before formal disposition.
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-bold py-2.5"
          >
            {submitting ? "Registering Grievance..." : "Submit Grievance to Directorate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
