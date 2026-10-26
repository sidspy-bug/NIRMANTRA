"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquareWarning,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GrievanceRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";

export default function GrievancesRegistryPage() {
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await NirmaantraApi.getGrievances();
      setGrievances(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = grievances.filter((g) => {
    const matchesSearch =
      g.id.toLowerCase().includes(search.toLowerCase()) ||
      g.category.toLowerCase().includes(search.toLowerCase()) ||
      g.buildingAddress.toLowerCase().includes(search.toLowerCase()) ||
      (g.buildingUid && g.buildingUid.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" || g.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer
      title="Public Grievance & Safety Redressal Register"
      description="Track citizen-reported building safety deviations, locked fire staircases, and illegal additions. Allegations are subject to statutory verification and whistleblower protection."
      breadcrumbs={[
        { label: "Citizen's Corner", href: "#" },
        { label: "Public Grievances" },
      ]}
      action={
        <Link href="/grievances/submit">
          <Button className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold">
            + File a Safety Grievance
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Anti-fabrication & Whistleblower Notice */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 text-xs text-amber-950 space-y-1">
          <p className="font-bold flex items-center">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-700" />
            Integrity & Fair Process Principle
          </p>
          <p className="text-[11px] leading-relaxed">
            Public listings show registered concerns and their official investigation status. Reports do not automatically constitute legal violations until verified on-site by municipal enforcement officers.
          </p>
        </div>

        {/* Search Strip */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Grievance Token (e.g. GRV-2026-4412), category, address, or building UID..."
                className="pl-9 text-xs"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded border border-input bg-background px-3 py-2 text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Field Inspection Ordered">Field Inspection Ordered</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed - Unsubstantiated">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Grievance Records */}
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
            Loading grievance records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-2">
            <MessageSquareWarning className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No grievances found</h4>
            <p className="text-xs text-slate-500">No complaints matched your search filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((g) => (
              <Card
                key={g.id}
                className="bg-white hover:border-[#3b185f]/40 transition-colors shadow-2xs"
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {g.id}
                      </span>
                      <Badge
                        variant={
                          g.status === "Resolved"
                            ? "success"
                            : g.status === "Field Inspection Ordered"
                            ? "warning"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {g.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {g.category}
                      </Badge>
                      {g.buildingUid && (
                        <Link
                          href={`/buildings/${g.buildingUid}`}
                          className="text-[11px] font-mono text-blue-900 underline"
                        >
                          UID: {g.buildingUid}
                        </Link>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{g.buildingAddress}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      "{g.description}"
                    </p>

                    <div className="pt-1 flex items-center space-x-3 text-[11px] text-slate-500">
                      <span>Filed: {new Date(g.submittedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Zone: {g.zone}</span>
                      <span>•</span>
                      <span>Evidence: {g.evidenceMedia.length} attached files</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0">
                    <Link href={`/grievances/${g.id}`}>
                      <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-8 px-4 font-semibold">
                        View Dossier & Disposition <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
