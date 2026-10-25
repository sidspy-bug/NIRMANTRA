"use client";

import React from "react";
import Link from "next/link";
import { Megaphone, Link2, ChevronRight, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function NoticesQuickLinks() {
  const { user } = useAuth();
  const role = user?.role || "General Public";

  const notices = [
    {
      date: "25 Oct 2026",
      title: "Advisory on Commercial Building Safety Compliance in Delhi NCR",
      href: "/notices",
    },
    {
      date: "18 Oct 2026",
      title: "Submission of Building Plans - Important Guidelines & NBC Revisions",
      href: "/notices",
    },
    {
      date: "10 Oct 2026",
      title: "Public Safety Advisory on Fire Compartmentation - Ward 1 to 24",
      href: "/notices",
    },
    {
      date: "03 Oct 2026",
      title: "Public Grievance Redressal System Now Live for Unauthorized Alterations",
      href: "/grievances",
    },
  ];

  const publicQuickLinks = [
    { title: "NCR Building Regulations & Plan Scrutiny", href: "/services/submit-plan" },
    { title: "Track Submitted Applications", href: "/applications" },
    { title: "Building UID Registry & Public Record", href: "/buildings" },
    { title: "Public Grievances & Violation Reporting", href: "/grievances" },
    { title: "Help & Citizen Guidance", href: "/help" },
  ];

  const inspectorQuickLinks = [
    { title: "Assigned Field Inspections", href: "/inspections?tab=pending" },
    { title: "Submit Visit Evidence & Reports", href: "/inspections" },
    { title: "15-Day Overdue Audit Enforcement", href: "/inspections?tab=overdue" },
    { title: "Building Safety UID Lookup", href: "/buildings" },
    { title: "Inspector SOP & Field Guidelines", href: "/help" },
  ];

  const supervisorQuickLinks = [
    { title: "Supervisor Review Desk", href: "/supervisor" },
    { title: "Application Reviews", href: "/applications?tab=supervisor" },
    { title: "Review History & Audits", href: "/applications?tab=approved" },
    { title: "AI Override & Justification Log", href: "/applications?tab=rejected" },
    { title: "Zonal Inspection Oversight", href: "/inspections" },
  ];

  const quickLinks =
    role === "Inspecting Officer"
      ? inspectorQuickLinks
      : role === "Supervisor"
      ? supervisorQuickLinks
      : publicQuickLinks;

  return (
    <section className="py-8 border-t border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Latest Notices */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-md bg-[#ea580c] text-white flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Latest Notices</h3>
            </div>
            <Link
              href="/notices-map"
              className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {notices.map((n, idx) => (
              <Link
                key={idx}
                href={n.href}
                className="py-3 block group hover:bg-slate-50/70 -mx-2 px-2 rounded transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-semibold text-slate-800 group-hover:text-amber-800 transition-colors">
                    {n.title}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                    {n.date}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Links */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-md bg-[#d85a38] text-white flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Quick Links</h3>
          </div>

          <div className="space-y-3 mt-4">
            {quickLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50 group transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#d85a38] text-white flex items-center justify-center shrink-0">
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-950 transition-colors">
                  {link.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
