"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Building2, HardHat, FileSpreadsheet, ShieldCheck, Flame, Share2 } from "lucide-react";

export function HeroSection() {
  return (
    <section className="w-full bg-white pt-4 pb-8 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 4-Image Civic Collage Banner matching user theme */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100">
          {/* 1. Commercial Tower */}
          <div className="relative h-44 sm:h-56 bg-slate-900 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
              <span className="text-[11px] font-bold text-white tracking-wide flex items-center">
                <Building2 className="w-3.5 h-3.5 mr-1 text-amber-400" /> Commercial Heights, NCR
              </span>
            </div>
          </div>

          {/* 2. Architectural Blueprint */}
          <div className="relative h-44 sm:h-56 bg-slate-900 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
              <span className="text-[11px] font-bold text-white tracking-wide flex items-center">
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-blue-400" /> NBC Plan Scrutiny
              </span>
            </div>
          </div>

          {/* 3. Safety Engineers in Helmets */}
          <div className="relative h-44 sm:h-56 bg-slate-900 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1541888946425-d0fbb1861593?q=80&w=800&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
              <span className="text-[11px] font-bold text-white tracking-wide flex items-center">
                <HardHat className="w-3.5 h-3.5 mr-1 text-yellow-400" /> On-Site Field Audit
              </span>
            </div>
          </div>

          {/* 4. Fire Safety & Infrastructure */}
          <div className="relative h-44 sm:h-56 bg-slate-900 group overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
              <span className="text-[11px] font-bold text-white tracking-wide flex items-center">
                <Flame className="w-3.5 h-3.5 mr-1 text-rose-400" /> Fire & Life Safety Systems
              </span>
            </div>
          </div>
        </div>

        {/* Headline & Social Connect Bar matching Reference */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Building Safety for a Safer Tomorrow
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-3xl leading-relaxed">
              AI-powered plan verification, transparent inspections and public oversight for commercial buildings across Delhi NCR.
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Connect:</span>
            <a
              href="#facebook"
              aria-label="Facebook"
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#1877F2] hover:text-white flex items-center justify-center text-slate-700 transition-colors shadow-2xs text-xs font-bold"
            >
              f
            </a>
            <a
              href="#twitter"
              aria-label="Twitter X"
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-black hover:text-white flex items-center justify-center text-slate-700 transition-colors shadow-2xs text-xs font-bold"
            >
              𝕏
            </a>
            <a
              href="#linkedin"
              aria-label="LinkedIn"
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#0A66C2] hover:text-white flex items-center justify-center text-slate-700 transition-colors shadow-2xs text-xs font-bold"
            >
              in
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
