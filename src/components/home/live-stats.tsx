import React from "react";
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";

export function LiveStats() {
  const stats = [
    {
      label: "Total Applications Scrutinized",
      value: "14,892",
      change: "+12% this month",
      icon: CheckCircle2,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Avg. AI Clearance Time",
      value: "3.4 Min",
      change: "NBC Rule Engine v2.4",
      icon: Clock,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Safety Violations Flagged",
      value: "412",
      change: "Preventative action taken",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Digital Certificates Issued",
      value: "11,280",
      change: "100% QR verifiable",
      icon: ShieldCheck,
      color: "text-indigo-600 bg-indigo-50",
    },
  ];

  return (
    <section className="py-8 border-t border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  {item.label}
                </span>
                <div className={`p-2 rounded-md ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                {item.value}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">{item.change}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
