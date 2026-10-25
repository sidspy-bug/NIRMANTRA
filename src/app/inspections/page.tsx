"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  ClipboardList,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Camera,
  ArrowRight,
  ShieldAlert,
  Lock,
  FileCheck2,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InspectionRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";
import { RoleGuard } from "@/components/auth/role-guard";

function InspectionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Read query parameter reliably
  const rawTab = searchParams.get("tab") || "all";
  const validTabs = ["all", "pending", "completed", "overdue"];
  const currentTab = validTabs.includes(rawTab) ? rawTab : "all";

  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await NirmaantraApi.getInspections();
      setInspections(data);
      setLoading(false);
    }
    load();
  }, []);

  // Update tab in URL query parameter
  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "all") {
      params.delete("tab");
    } else {
      params.set("tab", newTab);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("q", search.trim());
    } else {
      params.delete("q");
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  // Sync search input if URL q changes externally
  useEffect(() => {
    setSearch(searchParams.get("q") || "");
  }, [searchParams]);

  // Tab Counts
  const pendingCount = inspections.filter((ins) => ins.status === "Scheduled").length;
  const completedCount = inspections.filter((ins) => ins.status === "Completed").length;
  const overdueCount = inspections.filter((ins) => ins.status === "Overdue").length;

  const filtered = inspections.filter((ins) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      ins.id.toLowerCase().includes(query) ||
      ins.buildingName.toLowerCase().includes(query) ||
      ins.buildingUid.toLowerCase().includes(query) ||
      ins.assignedOfficer.toLowerCase().includes(query) ||
      ins.location.toLowerCase().includes(query);

    const matchesTab =
      currentTab === "all" ||
      (currentTab === "pending" && ins.status === "Scheduled") ||
      (currentTab === "completed" && ins.status === "Completed") ||
      (currentTab === "overdue" && ins.status === "Overdue");

    return matchesSearch && matchesTab;
  });

  const getEmptyState = () => {
    if (search.trim()) {
      return {
        title: "No Matching Inspection Records",
        description: `No records matched your search query "${search}". Clear the search box to view all sector inspections.`,
      };
    }
    switch (currentTab) {
      case "pending":
        return {
          title: "No Pending Inspection Assignments",
          description: "All scheduled site visits in your sector jurisdiction are currently completed and up to date.",
        };
      case "completed":
        return {
          title: "No Completed Inspection Reports",
          description: "No completed inspection reports have been filed yet. Completed audits and verified photographs will be archived here.",
        };
      case "overdue":
        return {
          title: "No Overdue Inspections (15-Day Rule Compliant)",
          description: "Zero properties have exceeded the mandatory 180-day cycle or the 15-day statutory grace period. All building audits are in full compliance.",
        };
      default:
        return {
          title: "No Inspection Records Found",
          description: "No registered inspections found in the municipal directory.",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Statutory Policy Strip */}
      <div className="bg-[#f8f9fa] border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1">
          <span className="font-bold text-slate-900 flex items-center">
            <Clock className="w-4 h-4 mr-1 text-[#ea580c]" /> 6-Month Inspection Policy
          </span>
          <p className="text-[11px] text-slate-600">
            Only buildings with approved plans are eligible. Recurring site audit required every 180 days.
          </p>
        </div>
        <div className="space-y-1">
          <span className="font-bold text-slate-900 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" /> 15-Day Statutory Grace Period
          </span>
          <p className="text-[11px] text-slate-600">
            After missed due date, a 15-day cure window activates before enforcement penalties apply.
          </p>
        </div>
        <div className="space-y-1">
          <span className="font-bold text-slate-900 flex items-center">
            <Lock className="w-4 h-4 mr-1 text-red-600" /> Backend Account Enforcement
          </span>
          <p className="text-[11px] text-slate-600">
            Account suspension is enforced directly by the backend database service, not client-side flags.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Inspection ID (INS-...), building UID, officer name, or location..."
              className="pl-9 text-xs"
            />
          </div>
          {search && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                const params = new URLSearchParams(searchParams.toString());
                params.delete("q");
                const queryString = params.toString();
                router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
              }}
              className="text-xs"
            >
              Clear Search
            </Button>
          )}
        </form>

        {/* Dashboard Tabs synchronized with URL ?tab= */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleTabChange("all")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              currentTab === "all"
                ? "bg-[#2a1b4e] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Inspections ({inspections.length})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("pending")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              currentTab === "pending"
                ? "bg-[#2a1b4e] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Assigned Inspections ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("completed")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              currentTab === "completed"
                ? "bg-[#2a1b4e] text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Inspection Reports ({completedCount})
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("overdue")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              currentTab === "overdue"
                ? "bg-red-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Overdue Status (15-Day Rule) ({overdueCount})
          </button>
        </div>
      </div>

      {/* Inspections Table / Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
          Loading inspection records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-2">
          <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">{getEmptyState().title}</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">{getEmptyState().description}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ins) => {
            const isGracePeriodElapsed = new Date() > new Date(ins.gracePeriodEndsAt);

            return (
              <Card
                key={ins.id}
                className="bg-white hover:border-[#3b185f]/40 transition-colors shadow-2xs"
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {ins.id}
                      </span>
                      <Link
                        href={`/buildings/${ins.buildingUid}`}
                        className="text-xs font-mono text-blue-900 underline hover:text-blue-700"
                      >
                        UID: {ins.buildingUid}
                      </Link>
                      <Badge
                        variant={
                          ins.status === "Completed"
                            ? "success"
                            : ins.status === "Overdue"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[10px]"
                      >
                        {ins.status === "Scheduled" ? "Pending / Scheduled" : ins.status}
                      </Badge>
                      {ins.isAccountBlocked && (
                        <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">
                          Account Flagged
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{ins.buildingName}</h3>

                    <p className="text-xs text-slate-600">Location: {ins.location}</p>

                    <p className="text-[11px] text-slate-500">
                      Assigned Officer:{" "}
                      <span className="font-semibold text-slate-700">{ins.assignedOfficer}</span> (
                      {ins.assignedOfficerId})
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                      <span className="text-slate-600">
                        Due Date: <strong className="font-mono">{ins.dueDate}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-slate-600">
                        Grace Period Ends:{" "}
                        <strong className="font-mono text-amber-800">{ins.gracePeriodEndsAt}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-slate-500">
                        Evidence Photos: {ins.photos.length} / target 10–20
                      </span>
                    </div>

                    {/* Overdue 15-Day Grace Period Alert */}
                    {ins.status === "Overdue" && (
                      <div className="mt-2 p-3 bg-red-50/80 border border-red-200 rounded-md text-xs space-y-1">
                        <div className="flex items-center justify-between text-red-900 font-bold">
                          <span className="flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1 text-red-600" />
                            15-Day Grace Period Status:
                          </span>
                          <span className="font-mono text-[10px] bg-red-200 text-red-900 px-1.5 py-0.5 rounded">
                            {isGracePeriodElapsed ? "GRACE PERIOD EXPIRED" : "ACTIVE 15-DAY BUFFER"}
                          </span>
                        </div>
                        <p className="text-[11px] text-red-800">
                          Scheduled 6-month site audit due on{" "}
                          <span className="font-mono font-bold">{ins.dueDate}</span> was missed. Statutory 15-day cure buffer elapsed on{" "}
                          <span className="font-mono font-bold">{ins.gracePeriodEndsAt}</span>.
                        </p>
                        {ins.accountBlockNotice && (
                          <p className="text-[11px] text-red-900 font-semibold pt-1 border-t border-red-200/60">
                            {ins.accountBlockNotice}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Completed Inspection Summary & Report Access */}
                    {ins.status === "Completed" && (
                      <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-md text-xs text-emerald-900 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                            Field Audit Report Certified & Recorded
                          </span>
                          {ins.completedAt && (
                            <span className="font-mono text-[10px] text-emerald-800">
                              Completed: {new Date(ins.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {ins.inspectorObservations && (
                          <p className="text-[11px] text-slate-700">
                            <strong>Certified Findings:</strong> {ins.inspectorObservations}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 font-mono">
                          Photographic Proof: {ins.photos.length} geotagged site captures on file
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end justify-between gap-2 shrink-0">
                    <Link href={`/inspections/${ins.id}`}>
                      <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-8 px-4 font-semibold">
                        {ins.status === "Completed" ? "View Full Report" : "Open Field Visit Desk"}{" "}
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </Link>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ins.aiImageAnalysisStatus}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function InspectionsPage() {
  return (
    <RoleGuard allowedRoles={["Inspecting Officer", "Supervisor"]}>
      <PageContainer
        title="Field Inspection Directorate & Audit Register"
        description="Coordination of on-site structural audits for approved commercial buildings. Enforces the 6-month statutory inspection policy and 15-day grace period."
        breadcrumbs={[
          { label: "Inspection Department", href: "/inspections" },
          { label: "Inspection Register" },
        ]}
      >
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Inspections...</div>}>
          <InspectionsContent />
        </Suspense>
      </PageContainer>
    </RoleGuard>
  );
}
