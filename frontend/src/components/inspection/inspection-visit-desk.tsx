"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Save,
  ArrowLeft,
  Upload,
  Calendar,
  Building2,
  FileCheck2,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { InspectionRecord, InspectionPhoto } from "@/types";
import { NirmaantraApi } from "@/services/api";

const VIEW_TYPES: InspectionPhoto["viewType"][] = [
  "Exterior Front",
  "Exterior Rear",
  "Setback Driveway",
  "Fire Staircase",
  "Basement Riser",
  "Interior Lobby",
  "Rooftop Tank",
  "Electrical Room",
];

interface InspectionVisitDeskProps {
  inspectionId: string;
}

export function InspectionVisitDesk({ inspectionId }: InspectionVisitDeskProps) {
  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [observations, setObservations] = useState("");
  const [currentViewType, setCurrentViewType] = useState<InspectionPhoto["viewType"]>("Exterior Front");
  const [captionInput, setCaptionInput] = useState("");
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await NirmaantraApi.getInspectionById(inspectionId);
      if (data) {
        setRecord(data);
        setPhotos(data.photos || []);
        setObservations(data.inspectorObservations || "");
      }
      setLoading(false);
    }
    load();
  }, [inspectionId]);

  const handleAddPhotoSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const newPhoto: InspectionPhoto = {
      id: `p-${Date.now()}`,
      caption: captionInput.trim() || `${currentViewType} site audit snapshot`,
      viewType: currentViewType,
      timestamp: new Date().toISOString(),
      url: URL.createObjectURL(file),
    };

    setPhotos((prev) => [...prev, newPhoto]);
    setCaptionInput("");
    e.target.value = "";
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveDraft = async () => {
    if (!record) return;
    setSaving(true);
    setSaveNotice(null);
    const updated = await NirmaantraApi.saveInspectionVisit(record.id, photos, observations, false);
    if (updated) {
      setRecord({ ...updated });
      setSaveNotice("Inspection draft progress saved. You can resume at any time.");
    }
    setSaving(false);
  };

  const handleCompleteVisit = async () => {
    if (!record) return;
    if (photos.length < record.targetPhotoCountMin) {
      if (
        !confirm(
          `Statutory target is 10–20 photos. You currently have ${photos.length}. Submit anyway?`
        )
      ) {
        return;
      }
    }
    setSaving(true);
    const updated = await NirmaantraApi.saveInspectionVisit(record.id, photos, observations, true);
    if (updated) {
      setRecord({ ...updated });
      setSaveNotice("Field audit finalized. Official inspection report generated and archived.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
        Loading inspection visit dossier...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-2">
        <h3 className="text-sm font-bold text-slate-800">Inspection Record Not Found</h3>
        <p className="text-xs text-slate-500">No inspection matching ID {inspectionId}.</p>
        <Link href="/inspections">
          <Button variant="outline" size="sm" className="text-xs">
            Return to Register
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Strip: Back & Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-3 print:hidden">
        <Link href="/inspections">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Inspections
          </Button>
        </Link>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / Save Report View
          </Button>
          <Button
            size="sm"
            onClick={handleSaveDraft}
            disabled={saving}
            className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Progress
          </Button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold print:hidden">
          {saveNotice}
        </div>
      )}

      {/* Main Inspection Printable Report Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-6">
        {/* Departmental Header Banner for Print and Screen */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                Official Site Audit Report • 6-Month Mandated Cycle
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {record.buildingName}
              </h2>
              <p className="text-xs text-slate-600">
                Location: {record.location} • Linked Building UID:{" "}
                <Link
                  href={`/buildings/${record.buildingUid}`}
                  className="font-mono text-blue-900 underline font-semibold"
                >
                  {record.buildingUid}
                </Link>
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                {record.id}
              </span>
              <div className="mt-1">
                <Badge
                  variant={
                    record.status === "Completed"
                      ? "success"
                      : record.status === "Overdue"
                      ? "destructive"
                      : "warning"
                  }
                  className="text-xs"
                >
                  {record.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/70 border border-slate-200 rounded-lg text-xs">
          <div>
            <span className="text-slate-500 text-[11px] block">Assigned Officer</span>
            <span className="font-bold text-slate-800">{record.assignedOfficer}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Officer ID</span>
            <span className="font-mono font-bold text-slate-800">{record.assignedOfficerId}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Statutory Due Date</span>
            <span className="font-mono font-bold text-slate-800">{record.dueDate}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[11px] block">Grace Period End</span>
            <span className="font-mono font-bold text-amber-800">{record.gracePeriodEndsAt}</span>
          </div>
        </div>

        {/* Target 10-20 Photo Gallery Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Camera className="w-4 h-4 mr-1.5 text-[#ea580c]" />
                Geotagged Photographic Evidence ({photos.length} photos)
              </h3>
              <p className="text-[11px] text-slate-500">
                Statutory requirement: <strong>Target of 10 to 20 photographs</strong> covering front, rear, setbacks, and fire suppression systems.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-600">
              Progress: <strong className={photos.length >= 10 ? "text-emerald-700" : "text-amber-700"}>{photos.length} / 20</strong>
            </div>
          </div>

          {/* Upload Controls (hidden in print) */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Viewpoint Category
                </label>
                <select
                  value={currentViewType}
                  onChange={(e) => setCurrentViewType(e.target.value as any)}
                  className="w-full h-9 rounded border border-input bg-white px-2 text-xs"
                >
                  {VIEW_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Observation / Photo Caption
                </label>
                <Input
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="e.g. Setback driveway measurement: 6.8m clear"
                  className="h-9 text-xs bg-white"
                />
              </div>
            </div>

            <div>
              <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-bold rounded shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Field Photograph</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAddPhotoSim}
                />
              </label>
              <span className="text-[11px] text-slate-500 ml-3">
                Select camera capture or JPEG/PNG file.
              </span>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          {photos.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
              No field photographs uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs flex flex-col justify-between"
                >
                  <div className="relative h-40 bg-slate-900">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                      {photo.viewType}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded hover:bg-red-700 print:hidden"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-2.5 text-xs">
                    <p className="font-semibold text-slate-800 line-clamp-2">{photo.caption}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      {new Date(photo.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inspector Written Observations (Certified Manual Audit) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Certified Inspector Observations & Findings
            </h3>
            <span className="text-[11px] text-slate-500">Manual Entry by Assigned Officer</span>
          </div>

          <textarea
            rows={5}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Record physical inspection findings: setback measurements, fire escape accessibility, driveway clearances, presence of wet riser pressure gauges, structural integrity observations..."
            className="w-full rounded-md border border-input p-3 text-xs text-slate-900 leading-relaxed"
          />
        </div>

        {/* Distinguish from AI Image Analysis (Strictly Unsimulated) */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs space-y-1.5">
          <p className="font-bold text-slate-800 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-700" />
            AI Computer Vision Image Analysis Status
          </p>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Status: <span className="font-mono font-bold text-amber-800">{record.aiImageAnalysisStatus}</span>.
            In compliance with project architecture guidelines, automated defect classification remains inactive until the teammate's model service is connected. The observations above represent certified physical entries by the assigned field engineer.
          </p>
        </div>

        {/* Bottom Actions for Submitting Visit */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
          <div className="text-xs text-slate-500">
            {record.status === "Completed" ? (
              <span className="text-emerald-700 font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> Visit Finalized & Locked
              </span>
            ) : (
              <span>Draft mode. Complete visit when observations and photos are ready.</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={saving}
              className="text-xs"
            >
              Save Draft
            </Button>
            {record.status !== "Completed" && (
              <Button
                size="sm"
                onClick={handleCompleteVisit}
                disabled={saving}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5"
              >
                Finalize & Sign Audit Report
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
