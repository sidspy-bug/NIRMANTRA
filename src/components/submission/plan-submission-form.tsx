"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle2, FileText, AlertCircle, Building, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PlanSubmissionForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Architectural & Structural Submission Form</CardTitle>
            <CardDescription className="text-xs">
              Upload digitized plans in PDF or DXF format for automated NBC rule validation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project / Building Name
                </label>
                <Input placeholder="e.g. Apex Heights Phase 2" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plot / Survey Number
                </label>
                <Input placeholder="e.g. PLOT-784-B/2026" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Occupancy Type
                </label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="residential">Residential (Group A)</option>
                  <option value="commercial">Commercial (Group E)</option>
                  <option value="institutional">Institutional (Group B)</option>
                  <option value="industrial">Industrial (Group G)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed Height (Meters)
                </label>
                <Input type="number" placeholder="e.g. 24.5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Built-up Area (Sq.m)
                </label>
                <Input type="number" placeholder="e.g. 1850" />
              </div>
            </div>

            {/* Document Upload Zone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Architectural Blueprint (PDF / DXF)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
                <UploadCloud className="w-10 h-10 mx-auto text-blue-600 mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Drag and drop your certified plan files here, or browse
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports .PDF, .DWG, .DXF up to 50MB. Digital Architect signature verified.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-slate-100 pt-5">
            <span className="text-[11px] text-slate-500 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              Cryptographic hash calculated on upload
            </span>
            <Button className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold">
              Proceed to Scrutiny Pipeline
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="bg-blue-50/50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-blue-950 flex items-center">
              <Building className="w-4 h-4 mr-1.5 text-blue-700" />
              Scrutiny Checklist Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2 text-slate-700">
            <p>● Floor Area Ratio (FAR) compliance calculation</p>
            <p>● Mandatory Front, Rear, and Side Setback dimensions</p>
            <p>● Fire tender access path (&gt;6.0m clear driveway)</p>
            <p>● Dual emergency staircases for heights &gt;15m</p>
            <p>● Seismic zone structural stability certification</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-slate-700" />
              Submission Protocol
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-600 space-y-2">
            <p>1. Upload verified plan drawings.</p>
            <p>2. Automated AI engine analyzes 60+ NBC regulations.</p>
            <p>3. Immediate provisional compliance report issued.</p>
            <p>4. Municipal officer review and site verification scheduled.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
