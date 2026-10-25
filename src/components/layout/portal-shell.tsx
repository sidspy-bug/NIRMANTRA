"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { GovHeader } from "@/components/layout/gov-header";
import { GovNavbar } from "@/components/layout/gov-navbar";
import { GovFooter } from "@/components/layout/gov-footer";

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthScreen = pathname === "/login" || pathname === "/splash";

  if (isAuthScreen) {
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <GovHeader />
      <GovNavbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <GovFooter />
    </div>
  );
}
