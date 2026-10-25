"use client";

import React, { useState } from "react";
import { MessageSquareWarning, ShieldAlert, Upload, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GrievanceForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">File Citizen Building Safety Grievance</CardTitle>
            <CardDescription className="text-xs">
              Report illegal construction, setback encroachements, blocked fire corridors, or structural distress.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Violation Category
                </label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option>Unauthorized Extra Floors / Construction</option>
                  <option>Setback Encroachment / Driveway Blocking</option>
                  <option>Fire Safety / Blocked Emergency Exits</option>
                  <option>Severe Structural Cracks / Hazard</option>
                  <option>Commercial Use in Residential Zone</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Building UID or Address
                </label>
                <Input placeholder="UID (if known) or full property address" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ward / Municipality Zone
                </label>
                <Input placeholder="e.g. Ward 12, South Zone" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complainant Contact (Kept Confidential)
                </label>
                <Input placeholder="Mobile No. for SMS updates" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Description of Violation
              </label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Provide specific details, floor numbers, or dates when unauthorized work began..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Photographic / Video Evidence
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50/50 hover:border-blue-500 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-1" />
                <p className="text-xs font-medium text-slate-700">Attach geo-tagged images or video clips</p>
                <p className="text-[11px] text-slate-400">JPG, PNG, MP4 up to 25MB</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-slate-100 pt-4">
            <span className="text-[11px] text-slate-500">
              Whistleblower Identity Protected by Directorate Rules
            </span>
            <Button className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold">
              Submit Grievance
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-amber-950 flex items-center">
              <ShieldAlert className="w-4 h-4 mr-1.5 text-amber-700" />
              Statutory Resolution Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-700 space-y-2">
            <p>● <strong>Acknowledgment:</strong> Instant grievance tracking token generated via SMS.</p>
            <p>● <strong>Preliminary Review:</strong> Within 48 hours by Municipal Ward Officer.</p>
            <p>● <strong>Physical Inspection:</strong> Within 5 working days with notice to property owner.</p>
            <p>● <strong>Status Published:</strong> Report and action taken visible on public dashboard.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
