"use client";

import React from "react";
import { Calendar, UserCheck, MapPin, CheckCircle, Clock, Camera, FileCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function InspectionScheduler() {
  const inspections = [
    {
      id: "INS-8910",
      site: "The Grand Horizon",
      officer: "Er. Ramesh Sharma (Sr. Inspector)",
      date: "27 Oct 2026",
      slot: "11:00 AM - 01:00 PM",
      stage: "Plinth Level Verification",
      status: "Scheduled",
      ward: "Ward 18, West Corridor",
    },
    {
      id: "INS-8911",
      site: "Zenith Tech Park Tower 1",
      officer: "Er. Priya Nair (Fire Safety Officer)",
      date: "28 Oct 2026",
      slot: "02:30 PM - 04:30 PM",
      stage: "Fire Safety & Stairwell Audit",
      status: "Inspector Confirmed",
      ward: "Ward 03, Cyber Belt",
    },
    {
      id: "INS-8904",
      site: "Silver Crest Enclave",
      officer: "Er. Ankit Verma (Civil Inspector)",
      date: "24 Oct 2026",
      slot: "10:00 AM - 12:00 PM",
      stage: "Final Occupancy Compliance",
      status: "Report Uploaded",
      ward: "Ward 07, North Sector",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Scheduled Today & Tomorrow</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono">18</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-emerald-600 font-semibold">● All inspectors geofence enabled</span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Site Reports Pending Upload</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-amber-600">4</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-amber-700 font-medium">Within 24h statutory window</span>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Completed This Month</CardDescription>
            <CardTitle className="text-2xl font-bold font-mono text-blue-900">328</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-slate-500">100% Geo-tagged photos archived</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Field Inspection Roster</CardTitle>
            <CardDescription className="text-xs">
              Randomized allocation of qualified inspectors to prevent conflicts of interest.
            </CardDescription>
          </div>
          <Button size="sm" className="bg-blue-900 text-white text-xs">
            + Schedule Field Audit
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {inspections.map((ins) => (
              <div
                key={ins.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{ins.id}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {ins.ward}
                    </Badge>
                    <Badge
                      variant={ins.status === "Report Uploaded" ? "success" : "warning"}
                      className="text-[10px]"
                    >
                      {ins.status}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{ins.site}</h4>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Assigned Officer:</span> {ins.officer}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Inspection Focus: <span className="font-medium text-slate-700">{ins.stage}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0">
                  <div className="text-right text-xs">
                    <div className="flex items-center text-slate-700 font-medium sm:justify-end">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {ins.date}
                    </div>
                    <span className="text-[11px] text-slate-500">{ins.slot}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <Camera className="w-3 h-3 mr-1" /> Site Media
                    </Button>
                    <Button size="sm" className="bg-slate-900 text-white text-xs h-7">
                      Audit Checklist
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
