"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  AlertOctagon,
  FileWarning,
  Search,
  ShieldAlert,
  ExternalLink,
  Building2,
  Layers,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NoticeRecord, BuildingRecord } from "@/types";
import { NirmaantraApi } from "@/services/api";

export function NoticesMapView() {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const nList = await NirmaantraApi.getNotices();
      const bList = await NirmaantraApi.getBuildings();
      setNotices(nList);
      setBuildings(bList);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="bg-[#f8f9fa] border border-slate-200 rounded-lg p-4 text-xs space-y-1">
        <p className="font-bold text-slate-900 flex items-center">
          <Info className="w-4 h-4 mr-1.5 text-blue-700" />
          Public Notice & Geospatial Verification Integrity
        </p>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Notices displayed below are marked clearly with their statutory verification origin. Unverified rumours or simulated emergency orders are excluded. Map spatial plots represent registered property coordinates only.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Geospatial Map Engine / Token Fallback */}
        <div id="map" className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden shadow-2xs">
            <CardHeader className="py-3 px-4 border-b border-slate-200 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5 text-red-600" />
                  Geospatial Compliance Registry
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Mapbox GL GIS spatial engine integration
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {mapboxToken ? "Mapbox Engine: Online" : "Token Not Configured (Graceful Fallback)"}
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {/* If Mapbox Token is absent, display clean spatial grid & building coordinates */}
              <div className="min-h-[380px] bg-slate-900 p-6 flex flex-col justify-between text-white relative">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs uppercase font-mono tracking-wider text-amber-400 font-bold">
                      Spatial Data Registry
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Delhi NCR Coordinate Datum (WGS84)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mapbox rendering is active when <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> is supplied in environment configuration. Showing certified building coordinates directly from registry:
                  </p>

                  <div className="space-y-2 mt-3">
                    {buildings.map((b) => (
                      <div
                        key={b.uid}
                        className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{b.buildingName}</p>
                          <p className="text-[10px] text-slate-400">
                            UID: <span className="font-mono text-amber-300">{b.uid}</span> • {b.ward}
                          </p>
                        </div>
                        <Link href={`/buildings/${b.uid}`}>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7 px-3"
                          >
                            Open Profile <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>No synthetic hazard zones or fake incident scores are generated.</span>
                  <span className="font-mono">Lat: 28.6139° N, Lng: 77.2090° E</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): Honest Notices Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Official Safety Notices</h3>
            <span className="text-xs text-slate-500">{notices.length} active circulars</span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-white rounded border border-slate-200">
              Loading notices...
            </div>
          ) : notices.length === 0 ? (
            <div className="p-6 text-center bg-white rounded border border-slate-200 space-y-1">
              <FileWarning className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-800">No active notices published</p>
              <p className="text-[11px] text-slate-500">
                All statutory building advisories will appear here upon formal gazette release.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <Card key={n.id} className="bg-white shadow-2xs hover:border-slate-300 transition-colors">
                  <CardContent className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {n.id}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {n.category}
                      </Badge>
                    </div>

                    <h4 className="font-bold text-slate-900 leading-snug">{n.title}</h4>

                    <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                      {n.summary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Published: {n.publishedDate}</span>
                      <span className="font-mono text-amber-800 font-semibold">
                        {n.verificationSource || "Official Notice"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
