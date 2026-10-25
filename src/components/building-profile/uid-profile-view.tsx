"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Calendar,
  FileCheck2,
  FileWarning,
  ExternalLink,
  Download,
  Flame,
  Trees,
  UserCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuildingRecord, InspectionRecord, GrievanceRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";

interface UidProfileViewProps {
  uid: string;
}

export function UidProfileView({ uid }: UidProfileViewProps) {
  const [building, setBuilding] = useState<BuildingRecord | null>(null);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const bData = await NirmaantraApi.getBuildingByUid(uid);
      setBuilding(bData);

      const allInspections = await NirmaantraApi.getInspections();
      setInspections(allInspections.filter((i) => i.buildingUid.toLowerCase() === uid.toLowerCase()));

      const allGrievances = await NirmaantraApi.getGrievances();
      setGrievances(allGrievances.filter((g) => g.buildingUid?.toLowerCase() === uid.toLowerCase()));

      setLoading(false);
    }
    load();
  }, [uid]);

  // Construct actual public URL for QR
  const currentHost = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const publicBuildingUrl = `${currentHost}/buildings/${uid}`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    publicBuildingUrl
  )}`;

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
        Loading verified public building record...
      </div>
    );
  }

  if (!building) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-3">
        <h3 className="text-base font-bold text-slate-900">Building UID Not Found</h3>
        <p className="text-xs text-slate-500">
          No registered property found for identifier <code>{uid}</code>.
        </p>
        <Link href="/buildings">
          <Button variant="outline" size="sm" className="text-xs">
            Return to Building Registry
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Official Building Passport Banner */}
      <Card className="border border-slate-200 bg-white shadow-md overflow-hidden">
        <div className="bg-[#2a1b4e] text-white px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>PUBLIC DIGITAL BUILDING PASSPORT (CIVIC RECORD)</span>
          </div>
          <span className="font-mono text-slate-300">UID: {building.uid}</span>
        </div>

        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    building.approvalStatus === "Approved Plan"
                      ? "success"
                      : building.approvalStatus === "Under Construction"
                      ? "warning"
                      : "destructive"
                  }
                  className="text-xs"
                >
                  {building.approvalStatus}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {building.category} Complex
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Occupancy: {building.occupancyCertificateStatus}
                </Badge>
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {building.buildingName}
              </h2>
              <div className="flex items-center text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                <span>{building.address} • {building.ward}, {building.zone}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs border-t border-slate-100">
                <div>
                  <span className="text-slate-500 block text-[11px]">Approved Plan Ref</span>
                  {building.approvedPlanReference ? (
                    <Link
                      href={`/applications/${building.approvedPlanReference}`}
                      className="font-mono font-bold text-blue-900 underline hover:text-blue-700"
                    >
                      {building.approvedPlanReference}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-500">Not available</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Plan Sanction Date</span>
                  <span className="font-semibold text-slate-800">
                    {building.planApprovalDate || "Not recorded"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Next Mandated Audit</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {building.nextInspectionDue || "Awaiting schedule"}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic QR Code Generator Card */}
            <div className="flex flex-col items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs shrink-0 self-center md:self-start">
              <div className="w-36 h-36 bg-white p-2 rounded-lg border border-slate-300 flex items-center justify-center">
                <img
                  src={qrSvgUrl}
                  alt={`QR Code for ${building.uid}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] text-slate-600 font-mono font-bold mt-2 text-center">
                {building.uid}
              </span>
              <span className="text-[9px] text-slate-400 text-center">Scan to open live profile</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Verified Safety & Clearances Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fire Safety */}
        <Card className="bg-white shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-700 flex items-center">
              <Flame className="w-4 h-4 mr-1 text-rose-600" /> Fire Safety NOC Certification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5">
            <p
              className={`text-base font-bold ${
                building.fireSafetyNocStatus === "Verified Valid"
                  ? "text-emerald-700"
                  : building.fireSafetyNocStatus === "Expired"
                  ? "text-red-700"
                  : "text-slate-700"
              }`}
            >
              {building.fireSafetyNocStatus}
            </p>
            {building.fireSafetyNocExpiry && (
              <p className="text-[11px] text-slate-500">
                Validity Expiry Date: <strong className="font-mono">{building.fireSafetyNocExpiry}</strong>
              </p>
            )}
            <p className="text-[10px] text-slate-400">
              Honest status rule: Displays "Not Verified" if field department certification is pending.
            </p>
          </CardContent>
        </Card>

        {/* Environmental Clearance */}
        <Card className="bg-white shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-700 flex items-center">
              <Trees className="w-4 h-4 mr-1 text-emerald-600" /> Environmental / Pollution Clearance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1.5">
            <p className="text-base font-bold text-slate-800">
              {building.environmentalClearanceStatus}
            </p>
            <p className="text-[11px] text-slate-500">
              State Pollution Control Board (DPCC / CPCB) compliance records.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Authorized Inspection Reports History */}
      <Card className="bg-white shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Statutory 6-Month Inspection History ({inspections.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Publicly authorized inspection reports and certified site audits.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4 text-xs space-y-3">
          {inspections.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded border border-slate-200 text-slate-500 text-center">
              No historical site inspection reports currently authorized for public display.
            </div>
          ) : (
            inspections.map((ins) => (
              <div
                key={ins.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900">{ins.id}</span>
                    <Badge
                      variant={ins.status === "Completed" ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {ins.status}
                    </Badge>
                  </div>
                  <p className="text-slate-700 font-semibold mt-1">
                    Audited by: {ins.assignedOfficer} ({ins.assignedOfficerId})
                  </p>
                  {ins.inspectorObservations && (
                    <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">
                      "{ins.inspectorObservations}"
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-slate-500">
                    Due: {ins.dueDate}
                  </span>
                  <Link href={`/inspections/${ins.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      View Official Report <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 4. Publicly Disclosed Supervisor Overrides */}
      <Card className="bg-white shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
            <UserCheck className="w-4 h-4 mr-1.5 text-[#3b185f]" />
            Disclosed Municipal Supervisor Override Records ({building.supervisorOverrides.length})
          </CardTitle>
          <CardDescription className="text-xs">
            In accordance with public accountability rules, any managerial override of screening flags is permanently logged.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-xs space-y-3">
          {building.supervisorOverrides.length === 0 ? (
            <p className="text-slate-500 text-xs italic">
              No supervisor overrides recorded for this property. Plan approved under standard parameters.
            </p>
          ) : (
            building.supervisorOverrides.map((ovr) => (
              <div
                key={ovr.overrideId}
                className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-amber-950">
                    Record ID: {ovr.overrideId}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {new Date(ovr.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-amber-900 font-semibold">
                  Officer: {ovr.reviewerName} ({ovr.reviewerRole})
                </p>
                <p className="text-slate-700 text-[11px]">
                  <strong>Original Screening Note:</strong> {ovr.originalFinding}
                </p>
                <p className="text-slate-800 text-[11px] bg-white p-2 rounded border border-amber-200">
                  <strong>Written Justification:</strong> {ovr.writtenJustification}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 5. Citizen Grievance History */}
      <Card className="bg-white shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Citizen Grievances & Redressal Records ({grievances.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Reported citizen safety issues and official municipal findings.
            </CardDescription>
          </div>
          <Link href={`/grievances/submit?buildingUid=${building.uid}`}>
            <Button size="sm" variant="outline" className="text-xs h-7">
              + Report Violation on this Building
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-4 text-xs space-y-2">
          {grievances.length === 0 ? (
            <p className="text-slate-500 text-xs italic">
              No active or historical citizen grievances registered against this building UID.
            </p>
          ) : (
            grievances.map((g) => (
              <div
                key={g.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900">{g.id}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {g.category}
                    </Badge>
                    <Badge
                      variant={g.status === "Resolved" ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {g.status}
                    </Badge>
                  </div>
                  <p className="text-slate-700 text-[11px] mt-1 line-clamp-1">{g.description}</p>
                </div>
                <Link href={`/grievances/${g.id}`}>
                  <Button variant="outline" size="sm" className="text-xs h-7">
                    View Grievance
                  </Button>
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
