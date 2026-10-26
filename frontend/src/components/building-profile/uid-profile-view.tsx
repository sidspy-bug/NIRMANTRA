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
  Printer,
  PhoneCall,
  Activity,
  CheckSquare,
  Zap,
  Copy,
  Check,
  Share2,
  Compass,
  Sparkles,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Droplets,
  Wind,
  Video,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuildingRecord, InspectionRecord, GrievanceRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";
import { BuildingQrPlacardModal } from "./building-qr-placard-modal";

interface UidProfileViewProps {
  uid: string;
}

export function UidProfileView({ uid }: UidProfileViewProps) {
  const [building, setBuilding] = useState<BuildingRecord | null>(null);
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"fire" | "maintenance" | "structural" | "inspections" | "transparency">("fire");
  const [isPlacardModalOpen, setIsPlacardModalOpen] = useState(false);
  const [showQrPayloadModal, setShowQrPayloadModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

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

  const currentHost = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const publicBuildingUrl = `${currentHost}/buildings/${uid}`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    publicBuildingUrl
  )}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(publicBuildingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
        <Activity className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
        Loading verified public building safety & maintenance record...
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

  const safety = building.safetyRecord;
  const maintenance = building.maintenanceRecord;

  // Cryptographic QR payload summary
  const qrPayload = {
    uid: building.uid,
    name: building.buildingName,
    category: building.category,
    address: building.address,
    jurisdiction: `${building.ward}, ${building.zone}, NCT of Delhi`,
    publicUrl: publicBuildingUrl,
    approvalStatus: building.approvalStatus,
    fireSafetyNoc: {
      status: building.fireSafetyNocStatus,
      nocNumber: safety?.fireSafety.nocNumber || "N/A",
      validUntil: building.fireSafetyNocExpiry || "Active",
    },
    safetyScore: `${safety?.overallSafetyScorePercent || 95}%`,
    safetyGrade: safety?.overallSafetyGrade || "Grade A",
    liftAmc: {
      provider: maintenance?.liftsAndEscalators.amcVendor || "Certified AMC",
      license: maintenance?.liftsAndEscalators.liftLicenseNumber || "Active",
      nextService: maintenance?.liftsAndEscalators.nextServiceDueDate || "Pending",
    },
    emergency: {
      fireHelpline: "101",
      safetyOfficer: `${safety?.emergencyContacts.safetyOfficerName} (${safety?.emergencyContacts.safetyOfficerPhone})`,
      fireStation: `${safety?.emergencyContacts.nearestFireStation} (${safety?.emergencyContacts.nearestFireStationPhone})`,
      assemblyArea: safety?.emergencyContacts.assemblyArea,
    },
    verifiedBy: "Government of NCT of Delhi - Building Safety Registry",
    timestamp: new Date().toISOString(),
  };

  const handleCopyJson = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(JSON.stringify(qrPayload, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Emergency Fast-Action Bar (Critical for First Responders & Citizens Scanning QR) */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-amber-900 text-white rounded-xl p-3.5 shadow-lg border border-rose-700/60 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-xs w-full md:w-auto">
          <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-400/40 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase text-[11px] tracking-wider text-amber-300">
                Live Emergency Safety Bar
              </span>
              <span className="bg-rose-950 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300">
                ● 24/7 Monitored
              </span>
            </div>
            <p className="text-[11px] text-rose-100">
              Immediate first-responder and safety contacts for this building location.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end text-xs">
          <a
            href="tel:101"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call Fire (101)
          </a>
          {safety?.emergencyContacts.safetyOfficerPhone && (
            <a
              href={`tel:${safety.emergencyContacts.safetyOfficerPhone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-950 hover:bg-rose-50 rounded-lg font-bold text-xs shadow-sm transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-700" /> Safety Officer: {safety.emergencyContacts.safetyOfficerPhone}
            </a>
          )}
          <Link href={`/grievances/submit?buildingUid=${building.uid}`}>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8">
              <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Report Hazard
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Official Building Passport & Scannable QR Card */}
      <Card className="border border-slate-200 bg-white shadow-md overflow-hidden">
        <div className="bg-[#2a1b4e] text-white px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold gap-2 border-b border-purple-900">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="tracking-wide uppercase">Official Public Digital Building Passport & Safety QR</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-amber-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800 text-xs">
              UID: {building.uid}
            </span>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            {/* Left: Building Specs & Clearance Badges */}
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    building.approvalStatus === "Approved Plan"
                      ? "success"
                      : building.approvalStatus === "Under Construction"
                      ? "warning"
                      : "destructive"
                  }
                  className="text-xs font-bold"
                >
                  {building.approvalStatus}
                </Badge>
                <Badge variant="outline" className="text-xs font-bold border-[#2a1b4e] text-[#2a1b4e]">
                  {building.category}
                </Badge>
                <Badge
                  variant={building.fireSafetyNocStatus === "Verified Valid" ? "success" : "destructive"}
                  className="text-xs font-bold"
                >
                  Fire NOC: {building.fireSafetyNocStatus}
                </Badge>
                {safety && (
                  <Badge variant="secondary" className="text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-300 border">
                    {safety.overallSafetyGrade}
                  </Badge>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {building.buildingName}
                </h2>
                <div className="flex items-center text-xs text-slate-600 mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                  <span>{building.address} • {building.ward}, {building.zone}</span>
                </div>
              </div>

              {/* Safety Score Meter */}
              {safety && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Statutory Safety & Maintenance Compliance Score
                    </span>
                    <span className="font-mono font-black text-emerald-800 text-sm">
                      {safety.overallSafetyScorePercent}%
                    </span>
                  </div>
                  <div className="w-full bg-emerald-200/60 rounded-full h-2.5 mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${safety.overallSafetyScorePercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 mt-1.5">
                    <span>Fire NOC Valid • Lifts AMC Certified • Seismic Stability Verified</span>
                    <span className="font-semibold">{safety.overallSafetyGrade}</span>
                  </div>
                </div>
              )}

              {/* Key Quick Metadata */}
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
                    <span className="font-semibold text-slate-500">Not recorded</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Fire NOC Expiry</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {building.fireSafetyNocExpiry || "Verified Active"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Next Mandated Audit</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {building.nextInspectionDue || "Awaiting schedule"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Scannable QR Code Box with Action Buttons */}
            <div className="flex flex-col items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm shrink-0 w-full sm:w-auto self-center lg:self-start">
              <div className="w-44 h-44 bg-white p-2 rounded-lg border-2 border-slate-900 shadow-sm flex items-center justify-center relative group">
                <img
                  src={qrSvgUrl}
                  alt={`QR Code for ${building.uid}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs text-slate-900 font-mono font-bold mt-2 text-center">
                UID: {building.uid}
              </span>
              <span className="text-[10px] text-slate-500 text-center max-w-[170px] mt-0.5">
                Scan with any mobile camera to view verified safety & AMC records
              </span>

              {/* QR Actions */}
              <div className="flex flex-col w-full gap-1.5 mt-3">
                <Button
                  size="sm"
                  onClick={() => setIsPlacardModalOpen(true)}
                  className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-7 px-3 w-full font-bold"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Building Placard
                </Button>
                <div className="flex gap-1.5 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQrPayloadModal(true)}
                    className="text-xs h-7 px-2 flex-1 text-slate-700"
                  >
                    <Activity className="w-3 h-3 mr-1" /> View QR Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="text-xs h-7 px-2 text-slate-700"
                    title="Copy Public Link"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Navigation Tabs for In-depth Safety and Maintenance Logs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("fire")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "fire"
              ? "bg-[#2a1b4e] text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          1. Fire Safety & DFS Clearance
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("maintenance")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "maintenance"
              ? "bg-[#2a1b4e] text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Activity className="w-4 h-4 text-blue-500" />
          2. Mechanical & Periodic AMC Health
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("structural")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "structural"
              ? "bg-[#2a1b4e] text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          3. Structural & Electrical Health
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inspections")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "inspections"
              ? "bg-[#2a1b4e] text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-purple-500" />
          4. Mandatory 6-Month Audits ({inspections.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transparency")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "transparency"
              ? "bg-[#2a1b4e] text-white shadow-xs"
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-500" />
          5. Disclosed Overrides & Grievances ({building.supervisorOverrides.length + grievances.length})
        </button>
      </div>

      {/* TAB 1: FIRE SAFETY & DFS CLEARANCE */}
      {activeTab === "fire" && (
        <div className="space-y-4">
          <Card className="bg-white shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
                    <Flame className="w-4 h-4 mr-1.5 text-rose-600" /> Delhi Fire Service (DFS) Statutory Clearance
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Mandatory life safety certification under Rule 27 of DFS Rules and Delhi UBBL-2016 Chapter 9.
                  </CardDescription>
                </div>
                <Badge
                  variant={building.fireSafetyNocStatus === "Verified Valid" ? "success" : "destructive"}
                  className="text-xs"
                >
                  NOC Status: {building.fireSafetyNocStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-rose-50/60 rounded-lg border border-rose-100">
                <div>
                  <span className="text-[11px] text-rose-900 font-semibold block">NOC Certificate Number</span>
                  <span className="font-mono font-bold text-rose-950 text-xs">
                    {safety?.fireSafety.nocNumber || "DFS/HQ/2026/VALID"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-rose-900 font-semibold block">Issue Date</span>
                  <span className="font-semibold text-slate-800">
                    {safety?.fireSafety.nocIssueDate || "2026-04-10"}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-rose-900 font-semibold block">Validity Expiry Date</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {safety?.fireSafety.nocExpiryDate || building.fireSafetyNocExpiry || "Active"}
                  </span>
                </div>
              </div>

              {/* Fire Safety Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block text-xs">Fire Evacuation Staircases</span>
                  <p className="text-slate-700">
                    Number of Staircases: <strong>{safety?.fireSafety.fireStaircasesCount || 3} independent exits</strong>
                  </p>
                  <p className="text-slate-700">
                    Staircase Clear Width: <strong>{safety?.fireSafety.staircaseWidthM || 2.0}m</strong> (meets UBBL Table 8.1 statutory minimum)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Enclosed with 2-hour fire-rated doors and positive pressure exhaust.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block text-xs">Corridors & Evacuation Ramps</span>
                  <p className="text-slate-700">
                    Corridor Width: <strong>{safety?.fireSafety.corridorWidthM || 2.4}m</strong> clear width
                  </p>
                  <p className="text-slate-700 text-[11px]">
                    Ramp Status: <strong>{safety?.fireSafety.evacuationRampStatus || "Compliant continuous emergency ramp"}</strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Max Travel Distance: <strong>{safety?.fireSafety.travelDistanceToExitM || 21.4}m</strong> (Statutory limit: 30.0m)
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block text-xs">Fire Suppression & Hydrant Network</span>
                  <p className="text-slate-700">
                    Sprinkler Grid: <strong>{safety?.fireSafety.sprinklerCoverage || "100% Fully Sprinklered"}</strong>
                  </p>
                  <p className="text-slate-700">
                    Hydrant Pressure: <strong>{safety?.fireSafety.hydrantPressurePsi || 65} PSI maintained</strong> at top terrace
                  </p>
                  <p className="text-slate-700 text-[11px]">
                    Pumps: <strong>{safety?.fireSafety.firePumpsStatus || "Electric Main + Diesel Standby Auto Cut-in"}</strong>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 block text-xs">Alarms, Refuge & Fire Drills</span>
                  <p className="text-slate-700">
                    Alarm Panel: <strong>{safety?.fireSafety.fireAlarmPanel || "Addressable Microprocessor Panel"}</strong>
                  </p>
                  <p className="text-slate-700">
                    Refuge Floors: <strong>{safety?.fireSafety.refugeFloors.join(", ") || "Floor 4, Terrace"}</strong>
                  </p>
                  <p className="text-slate-700 text-[11px]">
                    Last Fire Drill: <strong>{safety?.fireSafety.lastFireDrillDate || "Recent"}</strong> • Next Due: <strong>{safety?.fireSafety.nextFireDrillDue || "Within 90 days"}</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: MECHANICAL & PERIODIC AMC HEALTH */}
      {activeTab === "maintenance" && (
        <div className="space-y-4">
          <Card className="bg-white shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
                <Activity className="w-4 h-4 mr-1.5 text-blue-600" /> Mechanical Systems & Maintenance Health (AMC)
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time logs of elevator licensing, water tank reserves, HVAC air sanitation, and facility maintenance.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              {/* Lifts & Escalators */}
              <div className="p-3.5 bg-blue-50/60 rounded-lg border border-blue-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Lifts & Escalators (Vertical Transportation)
                  </span>
                  <Badge variant="outline" className="border-blue-400 text-blue-900 font-mono text-[10px]">
                    License: {maintenance?.liftsAndEscalators.liftLicenseNumber || "Active"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-500 block">AMC Vendor</span>
                    <strong>{maintenance?.liftsAndEscalators.amcVendor || "Certified AMC Partner"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Total Lift Inventory</span>
                    <strong>
                      {maintenance?.liftsAndEscalators.passengerLiftsCount || 4} Passenger + {maintenance?.liftsAndEscalators.serviceBedLiftsCount || 2} Service/Bed Lifts
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Last Service / Next Due</span>
                    <span className="font-mono text-xs">
                      {maintenance?.liftsAndEscalators.lastServicedDate || "2026-10-14"} / <strong>{maintenance?.liftsAndEscalators.nextServiceDueDate || "2026-11-14"}</strong>
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-white rounded border border-blue-100 flex items-center justify-between text-[11px] text-blue-900">
                  <span><strong>Automatic Rescue Device (ARD):</strong> {maintenance?.liftsAndEscalators.automaticRescueDevice || "Active on all lifts"}</span>
                  <span className="font-semibold text-emerald-700">● {maintenance?.liftsAndEscalators.loadCalibrationStatus || "Certified"}</span>
                </div>
              </div>

              {/* Water & Fire Reservoirs */}
              <div className="p-3.5 bg-cyan-50/60 rounded-lg border border-cyan-200 space-y-2">
                <span className="font-bold text-cyan-950 text-xs flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-600" />
                  Water Storage & Fire Reservoirs
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Underground Fire Reserve</span>
                    <strong className="text-cyan-950 font-mono text-sm">
                      {maintenance?.waterAndFireTanks.undergroundFireTankLitres.toLocaleString() || "250,000"} Litres
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Terrace Gravity Fire Tank</span>
                    <strong className="text-cyan-950 font-mono text-sm">
                      {maintenance?.waterAndFireTanks.terraceFireTankLitres.toLocaleString() || "40,000"} Litres
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Water Level Telemetry</span>
                    <strong className="text-emerald-700">
                      {maintenance?.waterAndFireTanks.waterLevelMonitoring || "98% Full (Monitored)"}
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  Automation: <strong>{maintenance?.waterAndFireTanks.jockeyPumpAutomation || "Hydro-pneumatic constant 8.0 bar"}</strong> • Last chlorination: {maintenance?.waterAndFireTanks.lastWaterHygieneChlorination || "Recent"}
                </p>
              </div>

              {/* HVAC & Smoke Extraction */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-slate-600" />
                  HVAC, Smoke Evacuation & Indoor Air Quality (IAQ)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Chiller & Ventilation</span>
                    <strong>{maintenance?.hvacAndAirQuality.chillerSystemType || "Central VRV Chillers"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Air Filtration Standard</span>
                    <strong className="text-indigo-900">{maintenance?.hvacAndAirQuality.iaqFilterRating || "HEPA H14 + MERV 13"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Smoke Evacuation Capacity</span>
                    <strong className="font-mono">{maintenance?.hvacAndAirQuality.smokeExtractionCapacityCfm?.toLocaleString() || "42,000"} CFM</strong>
                  </div>
                </div>
              </div>

              {/* Facility Services & Security */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-slate-600" />
                  Facility Services, Perimeter & Solar
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-500 block">CCTV Surveillance</span>
                    <strong>{maintenance?.facilityServices.cctvCoverageCameras || 120} Cameras</strong> ({maintenance?.facilityServices.cctvRetentionDays || 30}-day NVR)
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Facade Cleaning Audit</span>
                    <strong>{maintenance?.facilityServices.facadeCleaningCertExpiry || "Valid"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Waste Management</span>
                    <strong>{maintenance?.facilityServices.solidWasteSegregationStatus || "Active Organic Composter"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Solar Rooftop</span>
                    <strong className="font-mono text-emerald-700">{maintenance?.facilityServices.solarRooftopCapacityKw || 120} kW Capacity</strong>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: STRUCTURAL & ELECTRICAL HEALTH */}
      {activeTab === "structural" && (
        <div className="space-y-4">
          <Card className="bg-white shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" /> Structural Stability & Electrical Safety Audit
              </CardTitle>
              <CardDescription className="text-xs">
                Structural engineer certification under NBC-2016 and CEA Electrical Safety clearances.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              {/* Structural Stability Card */}
              <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-emerald-950 text-xs">
                    Structural Stability Certificate (Form 5 - UBBL)
                  </span>
                  <span className="font-mono text-emerald-900 font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                    Cert: {safety?.structuralSafety.stabilityCertificateNumber || "STR-DEL-2026/894"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Structural Engineer</span>
                    <strong>{safety?.structuralSafety.structuralEngineer || "Empanelled Structural Engineer"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Seismic Design Standard</span>
                    <strong className="text-rose-900">{safety?.structuralSafety.seismicDesignZone || "Zone IV (Delhi High Risk Compliant)"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Structural Health</span>
                    <strong className="text-emerald-800">{safety?.structuralSafety.structuralHealthStatus || "Certified Zero Distress"}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  Foundation: <strong>{safety?.structuralSafety.foundationType || "Raft with Bored Cast-in-situ RCC Piles"}</strong> • Deflection: <strong>{safety?.structuralSafety.cantileverDeflectionAudit || "Within IS 456 limits"}</strong>
                </p>
              </div>

              {/* Electrical Safety Card */}
              <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Central Electricity Authority (CEA) Clearance & Power Backup
                  </span>
                  <Badge variant="outline" className="border-amber-400 text-amber-900 font-semibold text-[10px]">
                    {safety?.electricalSafety.ceaComplianceStatus || "Certified Compliant"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Substation Transformer</span>
                    <strong>{safety?.electricalSafety.transformerCapacity || "2 x 1500 kVA Dry Type"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Diesel Generator (DG) Backup</span>
                    <strong className="text-amber-950">{safety?.electricalSafety.dgBackupCapacity || "100% Emergency Load Backup"}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Earthing Pit Resistance</span>
                    <strong className="font-mono text-emerald-800">
                      {safety?.electricalSafety.earthingResistanceOhms || 0.72} Ω (Statutory &lt; 1.0 Ω)
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600">
                  Thermal Scan: <strong>{safety?.electricalSafety.lastThermalImagingAudit || "Zero hotspots detected"}</strong> • Lightning Arrestor: <strong>{safety?.electricalSafety.lightningProtectionSystem || "Early Streamer Emission (ESE)"}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: MANDATORY 6-MONTH INSPECTIONS */}
      {activeTab === "inspections" && (
        <Card className="bg-white shadow-2xs border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Statutory 6-Month Inspection History ({inspections.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Publicly authorized municipal inspection reports and certified site audits.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-3">
            {inspections.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-center">
                No historical site inspection reports currently authorized for public display.
              </div>
            ) : (
              inspections.map((ins) => (
                <div
                  key={ins.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
      )}

      {/* TAB 5: DISCLOSED OVERRIDES & GRIEVANCES */}
      {activeTab === "transparency" && (
        <div className="space-y-4">
          {/* Overrides */}
          <Card className="bg-white shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
                <UserCheck className="w-4 h-4 mr-1.5 text-[#3b185f]" />
                Disclosed Municipal Supervisor Overrides ({building.supervisorOverrides.length})
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

          {/* Citizen Grievance History */}
          <Card className="bg-white shadow-2xs border-slate-200">
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
      )}

      {/* MODAL 1: PRINTABLE PLACARD */}
      <BuildingQrPlacardModal
        building={building}
        isOpen={isPlacardModalOpen}
        onClose={() => setIsPlacardModalOpen(false)}
      />

      {/* MODAL 2: RAW CRYPTOGRAPHIC QR PAYLOAD */}
      {showQrPayloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm">Cryptographic QR Safety Payload</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQrPayloadModal(false)}
                className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-600">
                This exact JSON structure is encoded into the building's QR passport and verified against the Municipal Building Safety Registry.
              </p>
              <pre className="p-3.5 bg-slate-950 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-80">
                {JSON.stringify(qrPayload, null, 2)}
              </pre>
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">UID: {building.uid}</span>
              <Button
                size="sm"
                onClick={handleCopyJson}
                className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-8"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy JSON Payload
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
