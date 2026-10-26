"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, ShieldCheck, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StatusLookup() {
  const router = useRouter();
  const [appNumber, setAppNumber] = useState("BLD-2026-98124");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (appNumber.trim()) {
      router.push(`/applications/${appNumber.trim()}`);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Card className="shadow-2xs">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">
            Instant Application Status Lookup
          </CardTitle>
          <CardDescription className="text-xs">
            Enter your official submission reference number to view multi-stage regulatory progress, supervisor review remarks, and field audit allocations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                placeholder="Enter Application No. (e.g. BLD-2026-98124)"
                className="pl-9 font-mono text-xs"
              />
            </div>
            <Button
              type="submit"
              className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white font-semibold text-xs px-5"
            >
              Track Application <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Sample registered IDs:{" "}
              <button
                type="button"
                onClick={() => setAppNumber("BLD-2026-98124")}
                className="text-blue-900 font-mono underline hover:text-blue-700"
              >
                BLD-2026-98124
              </button>
              ,{" "}
              <button
                type="button"
                onClick={() => setAppNumber("BLD-2026-44019")}
                className="text-blue-900 font-mono underline hover:text-blue-700"
              >
                BLD-2026-44019
              </button>
            </span>
            <Link
              href="/applications"
              className="text-[#3b185f] font-semibold hover:underline"
            >
              Browse Full Application Register →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
