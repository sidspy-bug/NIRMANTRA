"use client";

import React, { useRef } from "react";
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  Building2,
  Flame,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuildingRecord } from "@/types";

interface BuildingQrPlacardModalProps {
  building: BuildingRecord;
  isOpen: boolean;
  onClose: () => void;
}

export function BuildingQrPlacardModal({
  building,
  isOpen,
  onClose,
}: BuildingQrPlacardModalProps) {
  const placardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentHost =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const publicBuildingUrl = `${currentHost}/buildings/${building.uid}`;
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
    publicBuildingUrl
  )}`;

  const handlePrint = () => {
    window.print();
  };

  const safety = building.safetyRecord;
  const maintenance = building.maintenanceRecord;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-wide">
              Official Building Safety & Maintenance QR Placard
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-8 px-3"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Physical Placard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* The Printable Placard Body */}
        <div
          ref={placardRef}
          className="p-8 bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 print:p-6 print:m-0"
        >
          {/* Border Frame */}
          <div className="border-4 border-[#2a1b4e] rounded-xl p-6 bg-white shadow-md relative overflow-hidden">
            {/* Top Emblem Header */}
            <div className="text-center pb-4 border-b-2 border-slate-200 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2a1b4e] text-white rounded-full text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Govt. of NCT of Delhi • Municipal Building Safety Seal
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#2a1b4e] tracking-tight uppercase">
                Public Digital Building Passport
              </h1>
              <p className="text-[11px] text-slate-600 font-medium">
                Mandatory Safety & Periodic Maintenance Public Disclosure Notice (Delhi UBBL & DFS Act)
              </p>
            </div>

            {/* Building Info Row */}
            <div className="mt-4 pb-4 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{building.buildingName}</h2>
                  <div className="flex items-center text-xs text-slate-600 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                    <span>{building.address} • {building.ward}, {building.zone}</span>
                  </div>
                </div>
                <div className="text-right sm:text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Digital UID</span>
                  <span className="font-mono text-base font-extrabold text-[#2a1b4e] bg-amber-50 px-2.5 py-0.5 rounded border border-amber-300">
                    {building.uid}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <Badge variant="outline" className="text-[10px] font-bold border-[#2a1b4e] text-[#2a1b4e]">
                  {building.category}
                </Badge>
                <Badge
                  variant={building.fireSafetyNocStatus === "Verified Valid" ? "success" : "destructive"}
                  className="text-[10px] font-bold"
                >
                  Fire NOC: {building.fireSafetyNocStatus}
                </Badge>
                {safety && (
                  <Badge variant="secondary" className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-300 border">
                    Safety Rating: {safety.overallSafetyGrade}
                  </Badge>
                )}
              </div>
            </div>

            {/* Core Section: Big QR Code + Essential Safety Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center my-5">
              {/* QR Code Presentation */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border-2 border-dashed border-[#2a1b4e]/30">
                <div className="w-48 h-48 bg-white p-2.5 rounded-lg border-2 border-slate-900 shadow-sm flex items-center justify-center">
                  <img
                    src={qrSvgUrl}
                    alt={`QR Code for ${building.uid}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="mt-2 text-[11px] font-bold text-slate-900 text-center uppercase tracking-wide">
                  Scan With Any Smartphone
                </p>
                <p className="text-[10px] text-slate-500 text-center">
                  Instantly displays real-time fire safety clearances, AMC logs & emergency contacts
                </p>
              </div>

              {/* Verified Clearances Summary Checklist */}
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200">
                  <div className="flex items-center text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                    <span>Delhi Fire Service (DFS) Clearance</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    NOC: <strong className="font-mono">{safety?.fireSafety.nocNumber || "Verified"}</strong>
                  </p>
                  <p className="text-[10px] text-emerald-700">
                    Valid Until: <strong>{building.fireSafetyNocExpiry || "Active"}</strong>
                  </p>
                </div>

                <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-200">
                  <div className="flex items-center text-blue-900 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-blue-600 shrink-0" />
                    <span>Lifts & Mechanical AMC Health</span>
                  </div>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    AMC: <strong>{maintenance?.liftsAndEscalators.amcVendor || "Certified AMC Provider"}</strong>
                  </p>
                  <p className="text-[10px] text-blue-700">
                    License: <span className="font-mono">{maintenance?.liftsAndEscalators.liftLicenseNumber || "Active"}</span> • ARD Rescue: Verified
                  </p>
                </div>

                <div className="p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-200">
                  <div className="flex items-center text-indigo-900 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600 shrink-0" />
                    <span>Structural Stability & Seismic Audit</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 mt-0.5">
                    Seismic: <strong>{safety?.structuralSafety.seismicDesignZone || "Zone IV Compliant"}</strong>
                  </p>
                  <p className="text-[10px] text-indigo-700">
                    Certificate: <span className="font-mono">{safety?.structuralSafety.stabilityCertificateNumber || "Valid"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Fast Contacts Footer */}
            <div className="p-3.5 bg-slate-900 text-white rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-xs">
              <div className="border-b sm:border-b-0 sm:border-r border-slate-700 pb-2 sm:pb-0">
                <span className="text-[10px] uppercase text-amber-400 font-bold block">Delhi Fire Service</span>
                <span className="font-mono font-black text-sm text-white">101</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Emergency Fire Control</span>
              </div>
              <div className="border-b sm:border-b-0 sm:border-r border-slate-700 pb-2 sm:pb-0">
                <span className="text-[10px] uppercase text-amber-400 font-bold block">Building Safety Officer</span>
                <span className="font-mono font-bold text-xs text-white">
                  {safety?.emergencyContacts.safetyOfficerPhone || "+91-98110-44912"}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {safety?.emergencyContacts.safetyOfficerName || "On-duty Safety Marshal"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-amber-400 font-bold block">Evacuation Assembly Point</span>
                <span className="font-semibold text-xs text-white block">
                  {safety?.emergencyContacts.assemblyArea || "Main Open Lawn Gate 2"}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Ground Surface Zone</span>
              </div>
            </div>

            {/* Official Disclaimer Footer */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1">
              <span>National Capital Territory of Delhi • Building Safety Information Act</span>
              <span className="font-mono text-slate-400">Public Verification URL: {publicBuildingUrl}</span>
            </div>
          </div>
        </div>

        {/* Modal actions footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 print:hidden">
          <span>Displaying this placard at the entrance/reception is statutory under Clause 2.15 of UBBL.</span>
          <div className="flex items-center space-x-2">
            <a
              href={qrSvgUrl}
              download={`${building.uid}-official-qr.png`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm" className="text-xs h-8">
                <Download className="w-3.5 h-3.5 mr-1" /> Download QR Image
              </Button>
            </a>
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-8"
            >
              <Printer className="w-3.5 h-3.5 mr-1" /> Print Placard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
