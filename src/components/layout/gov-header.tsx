"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Mic,
  Volume2,
  Globe2,
  User,
  LogOut,
  KeyRound,
  Bell,
  Briefcase,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import {
  FlagOfIndia,
  StateEmblemOfIndia,
  DelhiNcrLogo,
  NirmaantraLogo,
  UserAvatarIcon,
} from "@/components/common/emblems";
import { useAuth } from "@/context/auth-context";

export function GovHeader() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (fontSize === "sm") {
        document.documentElement.style.fontSize = "14px";
      } else if (fontSize === "lg") {
        document.documentElement.style.fontSize = "18px";
      } else {
        document.documentElement.style.fontSize = "16px";
      }
    }
  }, [fontSize]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/applications?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getMyAssignmentsHref = () => {
    if (!user) return "/applications";
    if (user.role === "Inspecting Officer") return "/inspections";
    if (user.role === "Supervisor") return "/applications?tab=supervisor";
    return "/applications";
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 shadow-2xs">
      {/* 1. Slim Government-Style Top Strip */}
      <div className="bg-[#f8f9fa] border-b border-slate-200 text-slate-700 text-[11px] sm:text-xs py-1 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <FlagOfIndia className="w-4 h-3 shadow-2xs" />
            <span className="font-semibold text-slate-900 tracking-tight">भारत सरकार</span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-800 tracking-tight uppercase">
              GOVERNMENT OF NCT OF DELHI / NCR
            </span>
          </div>

          <div className="flex items-center space-x-3 text-slate-600 text-[11px]">
            {/* Screen Reader */}
            <button
              title="Screen Reader Access"
              onClick={() => alert("Screen Reader mode active (ARIA compliant tags enabled).")}
              className="hidden sm:flex items-center space-x-1 hover:text-slate-900 transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Screen Reader</span>
            </button>
            <span className="hidden sm:inline text-slate-300">|</span>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              title="Toggle Language"
              className="flex items-center space-x-1 hover:text-blue-900 font-semibold transition-colors"
            >
              <Globe2 className="w-3 h-3 text-blue-800" />
              <span>{lang === "en" ? "English / हिन्दी" : "हिन्दी / English"}</span>
            </button>
            <span className="text-slate-300">|</span>

            {/* Text Sizing Controls */}
            <div className="flex items-center space-x-1" aria-label="Text Sizing Controls">
              <button
                onClick={() => setFontSize("sm")}
                title="Decrease font size"
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${
                  fontSize === "sm" ? "bg-slate-300 border-slate-400" : "border-slate-200 hover:bg-slate-100"
                }`}
              >
                A-
              </button>
              <button
                onClick={() => setFontSize("md")}
                title="Standard font size"
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${
                  fontSize === "md" ? "bg-slate-300 border-slate-400" : "border-slate-200 hover:bg-slate-100"
                }`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize("lg")}
                title="Increase font size"
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${
                  fontSize === "lg" ? "bg-slate-300 border-slate-400" : "border-slate-200 hover:bg-slate-100"
                }`}
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Department Identity Header with Branding, Search, Delhi NCR Logo & Profile Dropdown */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: State Emblem + Official NIRMAANTRA Branding */}
        <div className="flex items-center space-x-3.5 shrink-0">
          <Link href="/" className="flex items-center space-x-3 group">
            <StateEmblemOfIndia className="w-11 h-14 text-slate-800 group-hover:scale-105 transition-transform" />

            <div className="h-10 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex flex-col">
              <NirmaantraLogo />
              <p className="text-xs font-bold text-slate-700 tracking-wide mt-0.5">
                Building Safety & Compliance Portal
              </p>
              <p className="text-[11px] text-slate-500 font-serif">
                निर्माण सुरक्षा एवं अनुपालन पोर्टल • दिल्ली राष्ट्रीय राजधानी क्षेत्र
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="w-full md:max-w-md lg:max-w-md">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search building UID, application no., regulation..."
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-3.5 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#3b185f] focus:outline-none focus:ring-1 focus:ring-[#3b185f] shadow-inner"
            />
            <button
              type="submit"
              title="Search"
              className="absolute right-1 p-1.5 bg-[#2a1b4e] text-white rounded hover:bg-[#3b185f] transition-colors shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Section: Delhi NCR Official Logo + User Profile Avatar Dropdown */}
        <div className="flex items-center space-x-4 shrink-0">
          {/* Official Delhi NCR Circular Heritage Emblem */}
          <div className="hidden sm:flex items-center">
            <DelhiNcrLogo className="w-12 h-12 hover:scale-105 transition-transform" />
          </div>

          {/* User Profile Avatar Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-1.5 p-1 rounded-full hover:ring-2 hover:ring-[#3b185f]/30 transition-all focus:outline-none"
              aria-label="User Account Menu"
              aria-expanded={profileOpen}
            >
              <UserAvatarIcon className="w-9 h-9" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="px-4 pb-3 border-b border-slate-100 flex items-center space-x-3">
                  <UserAvatarIcon className="w-10 h-10" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 truncate">
                      {user?.name || "Guest Visitor"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user?.role || "Citizen"}
                    </p>
                    {user?.userId && (
                      <span className="inline-block mt-0.5 bg-[#FEF08A] text-slate-900 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-amber-300">
                        ID: {user.userId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Role-Specific Navigation Items */}
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-[#2a1b4e] font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>

                  {user?.role === "General Public" && (
                    <>
                      <Link
                        href="/applications"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-[#2a1b4e] font-medium transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span>My Applications</span>
                      </Link>
                      <Link
                        href="/grievances"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-[#2a1b4e] font-medium transition-colors"
                      >
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span>My Grievances</span>
                      </Link>
                    </>
                  )}

                  {user?.role === "Inspecting Officer" && (
                    <>
                      <Link
                        href="/inspections?tab=pending"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-[#2a1b4e] font-medium transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span>Assigned Inspections</span>
                      </Link>
                      <Link
                        href="/inspections?tab=completed"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-[#2a1b4e] font-medium transition-colors"
                      >
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span>Inspection Reports</span>
                      </Link>
                    </>
                  )}

                  {user?.role === "Supervisor" && (
                    <>
                      <Link
                        href="/applications?tab=supervisor"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-[#2a1b4e] font-medium transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span>Application Reviews</span>
                      </Link>
                      <Link
                        href="/applications?tab=approved"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-[#2a1b4e] font-medium transition-colors"
                      >
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span>Review History & Audits</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* Logout Action */}
                <div className="pt-1.5 border-t border-slate-100 px-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 font-bold text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
