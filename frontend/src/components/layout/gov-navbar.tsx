"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X, HardHat, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || "General Public";

  return (
    <nav className="w-full bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-50 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11 text-xs">
          {/* Main Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {/* ROLE 1: GENERAL PUBLIC NAVIGATION */}
            {role === "General Public" && (
              <>
                <Link
                  href="/"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname === "/"
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Home
                </Link>

                <Link
                  href="/services/submit-plan"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/services/submit-plan")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Submit Building Plan
                </Link>

                <Link
                  href="/applications"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/applications")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Track Application
                </Link>

                <Link
                  href="/buildings"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/buildings") || pathname.startsWith("/building/")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Building QR & Public Record
                </Link>

                <Link
                  href="/notices"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/notices")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Notices & Updates
                </Link>

                <Link
                  href="/grievances"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/grievances")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Public Grievances
                </Link>

                <Link
                  href="/help"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/help")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Help
                </Link>

                <Link
                  href="/profile"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/profile")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  My Profile
                </Link>
              </>
            )}

            {/* ROLE 2: INSPECTING OFFICER NAVIGATION */}
            {role === "Inspecting Officer" && (
              <>
                <Link
                  href="/inspections"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors flex items-center space-x-1.5",
                    pathname === "/inspections" && (!currentTab || currentTab === "all")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  <HardHat className="w-3.5 h-3.5 text-amber-600" />
                  <span>Inspector Dashboard</span>
                </Link>

                <Link
                  href="/inspections?tab=pending"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname === "/inspections" && currentTab === "pending"
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Assigned Inspections
                </Link>

                <Link
                  href="/inspections?tab=completed"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname === "/inspections" && currentTab === "completed"
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Inspection Reports
                </Link>

                <Link
                  href="/inspections?tab=overdue"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname === "/inspections" && currentTab === "overdue"
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Overdue Status (15-Day Rule)
                </Link>

                <Link
                  href="/buildings"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/buildings")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Building Records
                </Link>

                <Link
                  href="/help"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/help")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Help
                </Link>

                <Link
                  href="/profile"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/profile")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  My Profile
                </Link>
              </>
            )}

            {/* ROLE 3: SUPERVISOR NAVIGATION */}
            {role === "Supervisor" && (
              <>
                <Link
                  href="/supervisor"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors flex items-center space-x-1.5",
                    pathname === "/supervisor"
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  <Shield className="w-3.5 h-3.5 text-[#3b185f]" />
                  <span>Supervisor Dashboard</span>
                </Link>

                <Link
                  href="/applications?tab=supervisor"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname === "/applications" && currentTab === "supervisor"
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Application Reviews
                </Link>

                <Link
                  href="/applications?tab=approved"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname === "/applications" && currentTab === "approved"
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Review History & Audits
                </Link>

                <Link
                  href="/inspections"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/inspections")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Inspection Oversight
                </Link>

                <Link
                  href="/buildings"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/buildings")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Building Registry
                </Link>

                <Link
                  href="/help"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/help")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  Help
                </Link>

                <Link
                  href="/profile"
                  className={cn(
                    "px-3 py-2 rounded font-semibold transition-colors",
                    pathname.startsWith("/profile")
                      ? "bg-[#f3e8ff] text-[#2a1b4e] border-b-2 border-[#3b185f] font-bold"
                      : "text-slate-800 hover:text-[#3b185f] hover:bg-slate-50"
                  )}
                >
                  My Profile
                </Link>
              </>
            )}
          </div>

          {/* Role Badge Indicator */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
              {role}
            </span>
          </div>

          {/* Right Hamburger / Mobile trigger */}
          <div className="flex items-center space-x-2 md:hidden">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
              {role}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-700 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (Role-Adaptive) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-2 text-xs">
          {role === "General Public" && (
            <>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-900 font-bold">Home</Link>
              <Link href="/services/submit-plan" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Submit Building Plan</Link>
              <Link href="/applications" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Track Application</Link>
              <Link href="/buildings" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Building QR & Public Record</Link>
              <Link href="/notices" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Notices & Updates</Link>
              <Link href="/grievances" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Public Grievances</Link>
              <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Help</Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium border-t border-slate-100 pt-2 font-bold">My Profile</Link>
            </>
          )}

          {role === "Inspecting Officer" && (
            <>
              <Link href="/inspections" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-900 font-bold">Inspector Dashboard</Link>
              <Link href="/inspections?tab=pending" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Assigned Inspections</Link>
              <Link href="/inspections?tab=completed" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Inspection Reports</Link>
              <Link href="/inspections?tab=overdue" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Overdue Status (15-Day Rule)</Link>
              <Link href="/buildings" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Building Records</Link>
              <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Help</Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium border-t border-slate-100 pt-2 font-bold">My Profile</Link>
            </>
          )}

          {role === "Supervisor" && (
            <>
              <Link href="/supervisor" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-900 font-bold">Supervisor Dashboard</Link>
              <Link href="/applications?tab=supervisor" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Application Reviews</Link>
              <Link href="/applications?tab=approved" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Review History & Audits</Link>
              <Link href="/inspections" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Inspection Oversight</Link>
              <Link href="/buildings" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Building Registry</Link>
              <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium">Help</Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-slate-700 font-medium border-t border-slate-100 pt-2 font-bold">My Profile</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export function GovNavbar() {
  return (
    <Suspense fallback={<nav className="w-full bg-white border-b border-slate-200 h-11" />}>
      <NavbarContent />
    </Suspense>
  );
}
