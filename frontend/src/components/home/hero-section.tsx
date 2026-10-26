"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Building2,
  Hotel,
  ShoppingBag,
  ShieldCheck,
  Flame,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="w-full bg-white pt-4 pb-8 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 4-Domain Focus Banner: Educational, Hospital, Hotel, Shopping Center */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-slate-100">
          {/* 1. Educational Buildings */}
          <div className="relative h-44 sm:h-56 bg-slate-900 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center">
                <GraduationCap className="w-3.5 h-3.5 mr-1" /> Domain 1
              </span>
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight mt-0.5">
                Educational Buildings
              </span>
              <span className="text-[10px] text-slate-300 hidden sm:block">
                Schools, Colleges & Campus Blocks
              </span>
            </div>
          </div>

          {/* 2. Hospitals & Healthcare */}
          <div className="relative h-44 sm:h-56 bg-slate-900 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=800&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1" /> Domain 2
              </span>
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight mt-0.5">
                Hospitals & Healthcare
              </span>
              <span className="text-[10px] text-slate-300 hidden sm:block">
                Corridors $\ge$2.4m & Evacuation Ramps
              </span>
            </div>
          </div>

          {/* 3. Commercial Hotels */}
          <div className="relative h-44 sm:h-56 bg-slate-900 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center">
                <Hotel className="w-3.5 h-3.5 mr-1" /> Domain 3
              </span>
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight mt-0.5">
                Commercial Hotels
              </span>
              <span className="text-[10px] text-slate-300 hidden sm:block">
                FAR 225/325, 3.0 ECS Parking
              </span>
            </div>
          </div>

          {/* 4. Shopping Centers */}
          <div className="relative h-44 sm:h-56 bg-slate-900 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=800&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-end p-3.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center">
                <ShoppingBag className="w-3.5 h-3.5 mr-1" /> Domain 4
              </span>
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight mt-0.5">
                Shopping Centers & Malls
              </span>
              <span className="text-[10px] text-slate-300 hidden sm:block">
                Max 30m Exit Travel Distance
              </span>
            </div>
          </div>
        </div>

        {/* Headline, Focal Description & Quick Action CTAs */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              <span>Specialized Statutory Compliance Engine — Delhi NCT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Statutory Verification for Educational, Hospitals, Hotels & Shopping Centers
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Zero-hallucination compliance audit engine grounded in the official <strong>Unified Building Bye-Laws for Delhi 2016 (UBBL-2016)</strong>, 
              <strong> Delhi Fire Service (DFS) Act & Rules</strong>, and <strong>Master Plan for Delhi (MPD-2021)</strong>. 
              Enforcing exact staircase widths, patient bed corridors, evacuation ramps, DFS NOC triggers, and ECS parking quotas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link href="/services/submit-plan">
              <Button className="w-full sm:w-auto bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-bold px-4 py-2.5 shadow-sm">
                <FileCheck2 className="w-4 h-4 mr-1.5" /> Submit Plan Scrutiny
              </Button>
            </Link>
            <Link href="/applications">
              <Button variant="outline" className="w-full sm:w-auto text-xs font-semibold px-4 py-2.5 border-slate-300 text-slate-700 hover:bg-slate-50">
                View Scrutiny Registry <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
