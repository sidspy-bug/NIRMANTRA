"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, LogOut, Lock } from "lucide-react";
import { useAuth, UserRole } from "@/context/auth-context";
import { StateEmblemOfIndia, DelhiNcrLogo } from "@/components/common/emblems";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-[#2a1b4e] animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Verifying authorization credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Check if current role is authorized
  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    const getHomeUrl = () => {
      if (user.role === "Inspecting Officer") return "/inspections";
      if (user.role === "Supervisor") return "/supervisor";
      return "/";
    };

    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-xl border border-red-200 p-8 shadow-sm space-y-6 text-center">
          {/* Header Emblems */}
          <div className="flex items-center justify-center space-x-4">
            <StateEmblemOfIndia className="w-10 h-14" />
            <div className="h-8 w-[1px] bg-slate-200" />
            <DelhiNcrLogo className="w-10 h-10" />
          </div>

          <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-red-50 border border-red-200 text-red-700">
              HTTP 403 • ACCESS RESTRICTED
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Access Denied — Insufficient Clearance
            </h1>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              This internal municipal workflow is restricted to authorized{" "}
              <strong>{allowedRoles.join(" or ")}</strong> personnel. Your current authenticated session is registered as:
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-slate-100 rounded-md border border-slate-200 text-xs font-mono font-bold text-slate-800">
                {user.role} (User ID: {user.userId})
              </span>
            </div>
          </div>

          {/* Statutory Security Note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 max-w-md mx-auto text-left flex items-start space-x-2">
            <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              Municipal building compliance records, officer rosters, and review determination desks are strictly protected under the statutory security policy.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={getHomeUrl()}>
              <Button className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-bold">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Authorized Home
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={logout}
              className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Logout & Switch Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
