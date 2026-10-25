"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StateEmblemOfIndia, NirmaantraLogo } from "@/components/common/emblems";
import { useAuth } from "@/context/auth-context";

export default function SplashScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // Exact 2000 milliseconds display window as specified
    const timer = setTimeout(() => {
      if (user.role === "Inspecting Officer") {
        router.replace("/inspections");
      } else if (user.role === "Supervisor") {
        router.replace("/supervisor");
      } else {
        router.replace("/");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
        {/* Crisp Ashoka Lion Capital with Satyameva Jayate */}
        <div className="animate-in zoom-in-95 duration-500">
          <StateEmblemOfIndia className="w-16 h-20 text-slate-900" />
        </div>

        {/* Brand Logo & Statutory Subtitles */}
        <div className="space-y-1.5">
          <NirmaantraLogo className="justify-center text-3xl" />
          <h2 className="text-sm font-bold text-slate-800 tracking-wide mt-2">
            Building Safety & Compliance Portal
          </h2>
          <p className="text-xs text-slate-500 font-serif">
            निर्माण सुरक्षा एवं अनुपालन पोर्टल • दिल्ली राष्ट्रीय राजधानी क्षेत्र
          </p>
        </div>

        {/* Restrained Loading Indicator & Dashboard Redirection */}
        <div className="pt-8 flex flex-col items-center space-y-3">
          {/* Circular Spinner in purple/blue */}
          <div className="relative w-10 h-10">
            <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-[#2a1b4e] animate-spin" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">Loading...</p>
            <p className="text-[11px] text-slate-500">
              Please wait, redirecting to your dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
