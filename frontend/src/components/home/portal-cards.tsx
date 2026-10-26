"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Search,
  QrCode,
  Megaphone,
  Bell,
  HelpCircle,
  HardHat,
  ClipboardCheck,
  AlertTriangle,
  ShieldCheck,
  Layers,
  Building,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function PortalCards() {
  const { user } = useAuth();
  const role = user?.role || "General Public";

  // Dedicated General Public Cards (6 Statutory Service Cards)
  const publicCards = [
    {
      title: "Submit Building Plan",
      description: "Enter building parameters and submit architectural drawings for automated screening and municipal scrutiny.",
      href: "/services/submit-plan",
      icon: FileText,
    },
    {
      title: "Track Application",
      description: "View your submitted applications, review progress timelines, scrutiny reports, and authorized decisions.",
      href: "/applications",
      icon: Search,
    },
    {
      title: "Building QR & Public Record",
      description: "Search building UID or scan on-site QR to access certified safety profiles and disclosed inspection records.",
      href: "/buildings",
      icon: QrCode,
    },
    {
      title: "Public Grievances",
      description: "Report suspected structural, setback, or fire safety violations with geotagged photo or video evidence.",
      href: "/grievances",
      icon: Megaphone,
    },
    {
      title: "Notices & Updates",
      description: "Review verified public safety advisories, National Building Code revisions, and municipal zoning notices.",
      href: "/notices",
      icon: Bell,
    },
    {
      title: "Help & Citizen Guidance",
      description: "Access step-by-step guidance for plan submissions, application tracking, grievance reporting, and FAQs.",
      href: "/help",
      icon: HelpCircle,
    },
  ];

  // Inspecting Officer Operational Cards
  const inspectorCards = [
    {
      title: "Assigned Inspections",
      description: "View scheduled mandatory 180-day field audits assigned to your officer jurisdiction.",
      href: "/inspections?tab=pending",
      icon: HardHat,
    },
    {
      title: "Submit Inspection Visit",
      description: "Conduct on-site audits, record checklist findings, and upload geotagged photographic/video evidence.",
      href: "/inspections",
      icon: ClipboardCheck,
    },
    {
      title: "Inspection Reports",
      description: "Review finalized statutory inspection dossiers, verified certificates, and punch lists.",
      href: "/inspections?tab=completed",
      icon: FileText,
    },
    {
      title: "Overdue Status (15-Day Rule)",
      description: "Monitor properties exceeding the statutory grace period for recurring safety inspections.",
      href: "/inspections?tab=overdue",
      icon: AlertTriangle,
    },
    {
      title: "Building Records Registry",
      description: "Query building safety profiles, structural permits, and occupancy certificates across Delhi NCR.",
      href: "/buildings",
      icon: Building,
    },
    {
      title: "Inspection SOP & Helpdesk",
      description: "Standard operating procedures, fire safety audit checklists, and departmental IT guidance.",
      href: "/help",
      icon: HelpCircle,
    },
  ];

  // Supervisor Review Cards
  const supervisorCards = [
    {
      title: "Supervisor Review Desk",
      description: "Authorized officer queue for reviewing building plan scrutiny submissions and screening recommendations.",
      href: "/supervisor",
      icon: ShieldCheck,
    },
    {
      title: "Application Reviews",
      description: "Access applications pending municipal zonal determination and architectural compliance verification (3-4 days window).",
      href: "/applications?tab=supervisor",
      icon: Layers,
    },
    {
      title: "Review History & Audits",
      description: "Audit sanctioned building plans, digital certificate records, reviewer determinations, and disclosed overrides.",
      href: "/applications?tab=approved",
      icon: FileText,
    },
    {
      title: "AI Overrides & Justification Audit",
      description: "Review statutory audit logs of supervisory overrides with written justification and committee resolutions.",
      href: "/applications?tab=rejected",
      icon: AlertTriangle,
    },
    {
      title: "Inspection Oversight Roster",
      description: "Monitor field inspection progress, officer tasking, and enforcement notice issuance across all wards.",
      href: "/inspections",
      icon: HardHat,
    },
    {
      title: "Regulatory Guidelines & Help",
      description: "Statutory building bylaws, circulars, unified building bye-laws (UBBL), and supervisory tools.",
      href: "/help",
      icon: HelpCircle,
    },
  ];

  const currentCards =
    role === "Inspecting Officer"
      ? inspectorCards
      : role === "Supervisor"
      ? supervisorCards
      : publicCards;

  return (
    <section className="py-8">
      {/* 2-Column Grid of Action Cards matching design reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {currentCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.href}
              className="group bg-white rounded-lg border border-slate-200/90 p-5 hover:border-amber-400 hover:shadow-md transition-all duration-200 flex items-start space-x-4 shadow-2xs"
            >
              {/* Circular Terracotta/Amber Arrow Button */}
              <div className="shrink-0 pt-0.5">
                <div className="w-10 h-10 rounded-full bg-[#d85a38] group-hover:bg-[#c24a29] text-white flex items-center justify-center shadow-xs transition-colors">
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Terracotta/Brown Square Icon Frame */}
              <div className="shrink-0 pt-0.5">
                <div className="w-10 h-10 rounded-md bg-[#ea580c] text-white flex items-center justify-center shadow-xs">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Text Block */}
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#3b185f] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
