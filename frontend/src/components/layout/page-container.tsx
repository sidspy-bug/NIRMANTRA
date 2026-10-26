import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface PageContainerProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function PageContainer({
  title,
  description,
  breadcrumbs,
  children,
  action,
}: PageContainerProps) {
  return (
    <div className="flex-1 pb-16">
      {/* Civic Breadcrumbs Bar */}
      <div className="border-b border-slate-200 bg-slate-50/70 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-800 transition-colors">
            Home
          </Link>
          {breadcrumbs?.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-slate-800 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-slate-800">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Page Header Header */}
      <div className="border-b border-slate-200 bg-white py-6 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-slate-600 max-w-3xl">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {children}
      </main>
    </div>
  );
}
