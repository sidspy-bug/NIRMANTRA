"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, FileText, Check, ShieldAlert, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function ReviewQueue() {
  const queueItems = [
    {
      id: "APP-2026-901",
      building: "Riverview Residency",
      floors: "G+14 Floors",
      ward: "Ward 12 (South)",
      aiScore: "96%",
      status: "Review Pending",
      flags: "Setback OK, Fire Stairs OK",
      type: "Residential",
    },
    {
      id: "APP-2026-902",
      building: "Galaxy Commercial Mall",
      floors: "3B+G+8 Floors",
      ward: "Ward 04 (Central)",
      aiScore: "74%",
      status: "Violation Alert",
      flags: "FAR limit exceeded by 4.2%",
      type: "Commercial",
    },
    {
      id: "APP-2026-903",
      building: "St. Jude Multispecialty Clinic",
      floors: "G+4 Floors",
      ward: "Ward 09 (East)",
      aiScore: "99%",
      status: "Ready for Sign-off",
      flags: "All NBC clearances verified",
      type: "Institutional",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900">Officer Scrutiny Desk</h3>
          <p className="text-xs text-slate-500">
            Digital signatory queue for Municipal Zonal Supervisors and Chief Town Planners.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            3 Applications In Queue
          </Badge>
          <Button variant="outline" size="sm" className="text-xs">
            <Filter className="w-3.5 h-3.5 mr-1" /> Filter by Ward
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Application ID</th>
                <th className="py-3 px-4">Building & Structure</th>
                <th className="py-3 px-4">Ward / Location</th>
                <th className="py-3 px-4">AI Scrutiny</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queueItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{item.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900">{item.building}</p>
                    <span className="text-[11px] text-slate-500">{item.floors} • {item.type}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{item.ward}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono font-bold ${
                        parseInt(item.aiScore) > 80 ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {item.aiScore}
                    </span>
                    <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{item.flags}</p>
                  </td>
                  <td className="py-3 px-4">
                    {item.status === "Violation Alert" ? (
                      <Badge variant="destructive" className="text-[10px]">
                        Violation Flagged
                      </Badge>
                    ) : item.status === "Ready for Sign-off" ? (
                      <Badge variant="success" className="text-[10px]">
                        Passed AI Audit
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Pending Review
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                      View Drawings
                    </Button>
                    <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white text-xs h-7 px-2.5">
                      Verify & Sign
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
