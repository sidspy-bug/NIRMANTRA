"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  X,
  Camera,
  ScanLine,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DEMO_BUILDINGS } from "@/data/demo-fixtures";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QrScannerModal({ isOpen, onClose }: QrScannerModalProps) {
  const router = useRouter();
  const [inputUid, setInputUid] = useState("");
  const [selectedPresetUid, setSelectedPresetUid] = useState<string | null>(null);
  const [isScanningSimulation, setIsScanningSimulation] = useState(false);

  if (!isOpen) return null;

  const handleSimulateScan = (uid: string) => {
    setSelectedPresetUid(uid);
    setIsScanningSimulation(true);
    setTimeout(() => {
      setIsScanningSimulation(false);
      onClose();
      router.push(`/buildings/${uid}`);
    }, 1200);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUid.trim()) return;
    onClose();
    router.push(`/buildings/${inputUid.trim()}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#2a1b4e] text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Scan Building QR Code</h3>
              <p className="text-[11px] text-slate-300">
                Access official safety clearances, fire NOC & maintenance health
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-slate-800 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          {/* Viewfinder simulation */}
          <div className="relative w-full h-52 bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center border-2 border-slate-800">
            {/* Viewfinder corner lines */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-amber-400" />

            {/* Scanning beam animation */}
            <div className="w-40 h-40 border border-amber-400/30 rounded-lg relative flex items-center justify-center overflow-hidden bg-white/5">
              <QrCode className="w-20 h-20 text-slate-600/40" />
              <div
                className={`absolute left-0 right-0 h-1 bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-bounce ${
                  isScanningSimulation ? "opacity-100" : "opacity-75"
                }`}
                style={{ animationDuration: "1.8s" }}
              />
            </div>

            <div className="absolute bottom-3 text-center">
              {isScanningSimulation ? (
                <span className="text-xs font-mono font-bold text-amber-400 bg-black/60 px-3 py-1 rounded-full animate-pulse">
                  Decoding Building UID: {selectedPresetUid}...
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 bg-black/60 px-3 py-0.5 rounded-full">
                  Align camera with official building QR seal or pick a test property below
                </span>
              )}
            </div>
          </div>

          {/* Quick 1-Click Scan Simulator Options */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              1-Click Scan Presets (Test Properties)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_BUILDINGS.map((b) => (
                <button
                  key={b.uid}
                  type="button"
                  onClick={() => handleSimulateScan(b.uid)}
                  disabled={isScanningSimulation}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-[#2a1b4e] hover:bg-slate-50 text-left transition-all group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#2a1b4e] truncate">
                      {b.buildingName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">{b.uid}</span>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        {b.safetyRecord?.overallSafetyScorePercent}% Safe
                      </span>
                    </div>
                  </div>
                  <ScanLine className="w-4 h-4 text-slate-400 group-hover:text-amber-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Or manual UID entry */}
          <div className="pt-2 border-t border-slate-100">
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                value={inputUid}
                onChange={(e) => setInputUid(e.target.value)}
                placeholder="Or type UID manually (e.g. NB-DL-2026-881)..."
                className="text-xs font-mono"
              />
              <Button
                type="submit"
                className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs px-4 shrink-0"
              >
                Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </form>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          Scanned building passports reflect statutory records grounded in Delhi UBBL-2016 and DFS Act.
        </div>
      </div>
    </div>
  );
}
