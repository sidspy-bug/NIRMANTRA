"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuildingRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";

export default function BuildingsRegistryPage() {
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await NirmaantraApi.getBuildings();
      setBuildings(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = buildings.filter((b) => {
    const matchesSearch =
      b.uid.toLowerCase().includes(search.toLowerCase()) ||
      b.buildingName.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase()) ||
      b.ward.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "All" || b.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <PageContainer
      title="Public Building UID & QR Registry"
      description="Searchable public registry for commercial and civic structures across Delhi NCR. Scan or verify physical building passport seals, fire safety NOC validity, and disclosed supervisor overrides."
      breadcrumbs={[
        { label: "Citizen's Corner", href: "#" },
        { label: "Building UID Registry" },
      ]}
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Building UID (e.g. NB-DL-2026-881), name, ward, or address..."
                className="pl-9 text-xs"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded border border-input bg-background px-3 py-2 text-xs"
            >
              <option value="All">All Categories</option>
              <option value="Commercial">Commercial</option>
              <option value="Residential">Residential</option>
              <option value="Institutional">Institutional</option>
            </select>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Direct public access registry • Updated regularly</span>
            <span className="text-emerald-700 font-medium">● 100% Cryptographic QR Verified</span>
          </div>
        </div>

        {/* Building Cards */}
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
            Loading building registry...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-2">
            <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No building records found</h4>
            <p className="text-xs text-slate-500">Please refine your search query or check the UID format.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((b) => (
              <Card
                key={b.uid}
                className="bg-white hover:border-[#3b185f]/40 transition-colors shadow-2xs flex flex-col justify-between"
              >
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      UID: {b.uid}
                    </span>
                    <Badge
                      variant={
                        b.approvalStatus === "Approved Plan"
                          ? "success"
                          : b.approvalStatus === "Under Construction"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px]"
                    >
                      {b.approvalStatus}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-base text-slate-900">{b.buildingName}</CardTitle>
                    <CardDescription className="text-xs text-slate-600 mt-0.5">
                      {b.address} • {b.ward}, {b.zone}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded border border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Fire Safety NOC:</span>
                      <span
                        className={`font-semibold ${
                          b.fireSafetyNocStatus === "Verified Valid"
                            ? "text-emerald-700"
                            : b.fireSafetyNocStatus === "Expired"
                            ? "text-red-700"
                            : "text-slate-600"
                        }`}
                      >
                        {b.fireSafetyNocStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Occupancy Status:</span>
                      <span className="font-semibold text-slate-800">
                        {b.occupancyCertificateStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Next Inspection Due:</span>
                      <span className="font-semibold font-mono text-slate-800">
                        {b.nextInspectionDue || "Not scheduled"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Active Grievances:</span>
                      <span className="font-semibold text-slate-800">
                        {b.activeGrievancesCount} reported
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      Overrides: {b.supervisorOverrides.length} disclosed
                    </span>
                    <Link href={`/buildings/${b.uid}`}>
                      <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs h-7 px-3 font-semibold">
                        <QrCode className="w-3.5 h-3.5 mr-1" /> View Passport & QR
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
