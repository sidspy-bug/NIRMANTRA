"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquareWarning,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  ArrowLeft,
  Building2,
  FileText,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { GrievanceRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";

interface GrievanceDossierViewProps {
  grievanceId: string;
}

export function GrievanceDossierView({ grievanceId }: GrievanceDossierViewProps) {
  const [grv, setGrv] = useState<GrievanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Disposition Review Form State
  const [officerName, setOfficerName] = useState("Officer P. K. Saxena (Zonal Enforcement)");
  const [newStatus, setNewStatus] = useState<GrievanceRecord["status"]>("Field Inspection Ordered");
  const [dispositionNotes, setDispositionNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [updateNotice, setUpdateNotice] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await NirmaantraApi.getGrievanceById(grievanceId);
      if (data) {
        setGrv(data);
        setNewStatus(data.status);
        setDispositionNotes(data.dispositionNotes || "");
      }
      setLoading(false);
    }
    load();
  }, [grievanceId]);

  const handleUpdateDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grv) return;
    setSaving(true);
    setUpdateNotice(null);

    const updated = await NirmaantraApi.updateGrievanceDisposition(
      grv.id,
      newStatus,
      officerName,
      dispositionNotes
    );

    if (updated) {
      setGrv({ ...updated });
      setUpdateNotice("Grievance disposition updated and stamped to public record.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
        Loading grievance dossier...
      </div>
    );
  }

  if (!grv) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-2">
        <h3 className="text-base font-bold text-slate-800">Grievance Not Found</h3>
        <p className="text-xs text-slate-500">No grievance matching ID {grievanceId}.</p>
        <Link href="/grievances">
          <Button variant="outline" size="sm" className="text-xs">
            Return to Register
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
              {grv.id}
            </span>
            <Badge
              variant={
                grv.status === "Resolved"
                  ? "success"
                  : grv.status === "Field Inspection Ordered"
                  ? "warning"
                  : "outline"
              }
              className="text-xs"
            >
              {grv.status}
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{grv.category}</h2>
          <p className="text-xs text-slate-600">
            {grv.buildingAddress} • {grv.zone}
          </p>
        </div>

        <Link href="/grievances">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> All Grievances
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Evidence and Details */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Grievance Description & Context
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Submitted Timestamp:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(grv.submittedAt).toLocaleString()}
                </span>
              </div>

              {grv.buildingUid && (
                <div>
                  <span className="text-slate-500 text-[11px] block">Linked Building UID:</span>
                  <Link
                    href={`/buildings/${grv.buildingUid}`}
                    className="font-mono font-bold text-blue-900 underline hover:text-blue-700"
                  >
                    {grv.buildingUid} ({grv.buildingName || "Building Record"})
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <span className="text-slate-500 text-[11px] block mb-1">Allegation Statement:</span>
                <p className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed font-sans">
                  "{grv.description}"
                </p>
              </div>

              {/* Confidentiality Notice */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold flex items-center text-slate-800">
                  <ShieldCheck className="w-4 h-4 mr-1 text-emerald-700" />
                  Whistleblower Identity Protected
                </p>
                <p>{grv.confidentialNotice}</p>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Files */}
          <Card className="bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Attached Evidence Files ({grv.evidenceMedia.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-xs">
              {grv.evidenceMedia.length === 0 ? (
                <p className="text-slate-500 italic">No media attachments were included.</p>
              ) : (
                <div className="space-y-2">
                  {grv.evidenceMedia.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800 uppercase text-[10px] bg-slate-200 px-1.5 py-0.5 rounded mr-2">
                          {m.type}
                        </span>
                        <span className="font-medium text-slate-800">{m.fileName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(m.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): Reviewer Disposition Interface */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white border-[#3b185f]/30 shadow-sm">
            <CardHeader className="bg-[#f3e8ff]/50 border-b border-[#e9d5ff] pb-3">
              <CardTitle className="text-sm font-bold text-[#2a1b4e] flex items-center">
                <UserCheck className="w-4 h-4 mr-1.5 text-[#3b185f]" />
                Enforcement Officer Disposition
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-600">
                Authorized municipal investigator interface to record findings and disposition.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              {updateNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded text-xs font-semibold">
                  {updateNotice}
                </div>
              )}

              <form onSubmit={handleUpdateDisposition} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Investigating Officer
                  </label>
                  <Input
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Grievance Disposition Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full h-9 rounded border border-input bg-white px-2 text-xs"
                  >
                    <option value="Under Preliminary Review">Under Preliminary Review</option>
                    <option value="Field Inspection Ordered">Field Inspection Ordered</option>
                    <option value="Resolved">Resolved (Violation Abated / Notice Issued)</option>
                    <option value="Dismissed - Unsubstantiated">Dismissed (Unsubstantiated)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Officer Investigation Notes
                  </label>
                  <textarea
                    rows={4}
                    value={dispositionNotes}
                    onChange={(e) => setDispositionNotes(e.target.value)}
                    placeholder="Record inquiry findings, notice numbers served, or reason for dismissal..."
                    className="w-full rounded border border-input p-2 text-xs"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-bold"
                >
                  {saving ? "Saving Disposition..." : "Update Grievance Disposition"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
