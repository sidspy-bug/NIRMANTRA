import React from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  HelpCircle,
  FileText,
  Search,
  QrCode,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";

export const metadata = {
  title: "Citizen Help & Guidance Portal - NIRMAANTRA",
  description:
    "Statutory guidelines, submission instructions, application tracking assistance, and FAQs for the NIRMAANTRA Building Safety & Compliance Portal.",
};

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I submit an architectural building plan for scrutiny?",
      answer:
        "Navigate to 'Submit Building Plan' (/services/submit-plan). Enter the building parameters (plot address, zone, occupancy group, built-up area, proposed height) and upload your architectural drawing file in PDF or DXF/DWG format along with the structural safety affidavit. The system automatically screens the drawings against National Building Code (NBC) parameters.",
    },
    {
      question: "What is an Application Reference Number and how do I track it?",
      answer:
        "Upon successful submission, you receive a unique statutory reference number formatted as BLD-2026-XXXXX. You can enter this reference on the 'Track Application' page (/applications) to monitor real-time review progress, automated screening findings, and municipal review determinations.",
    },
    {
      question: "What is the Building QR Code and where is it installed?",
      answer:
        "Every approved building in Delhi NCR is issued a permanent Building Unique Identification (UID) and a scannable QR Code plaque. As mandated by municipal safety bye-laws, this plaque is affixed at the main entrance, allowing any visitor, occupant, or municipal officer to instantly inspect certified safety statuses and valid fire NOC clearances.",
    },
    {
      question: "How do I report an unauthorized construction or safety violation?",
      answer:
        "Go to 'Public Grievances' (/grievances) and click 'Report a Safety Violation' (/grievances/submit). Provide the building address, description of the suspected violation (e.g. encroached setback, blocked emergency fire escape), and attach photographic or video proof. A tracking ticket (GRV-2026-XXXX) will be generated for public follow-up.",
    },
    {
      question: "What are the automated AI screening checks performed on drawings?",
      answer:
        "NIRMAANTRA verifies geometric and rule-based compliance according to Delhi Master Plan (MPD-2021/2041) and the Unified Building Bye-Laws (UBBL). Key checks include Floor Area Ratio (FAR), Ground Coverage percentages, Front/Rear/Side setback clearances, staircase width capacities, and mandatory fire tender access pathways.",
    },
  ];

  return (
    <PageContainer
      title="Help & Citizen Guidance Portal"
      description="Official operating guidelines, user walkthroughs, and procedural information for building safety, plan submissions, and public accountability across Delhi NCR."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Help & Guidance" },
      ]}
    >
      <div className="space-y-8">
        {/* Guidance Topic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Plan Submission Guide */}
          <Card className="bg-white border-slate-200 shadow-2xs hover:border-[#3b185f]/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-md bg-[#ea580c] text-white flex items-center justify-center mb-2">
                <FileText className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">
                1. Plan Submission Guide
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Standard requirements for uploading architectural blueprints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <ul className="list-disc pl-4 space-y-1">
                <li>Accepted formats: Vector PDF, DWG, or DXF up to 50MB</li>
                <li>Site plan must depict municipal road width and entry gates</li>
                <li>Drawings must clearly indicate front, rear, and side setbacks</li>
                <li>Requires structural designer registration certificate</li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/services/submit-plan"
                  className="text-xs font-bold text-[#3b185f] hover:underline inline-flex items-center"
                >
                  Go to Submission Form <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 2. Application Tracking Guide */}
          <Card className="bg-white border-slate-200 shadow-2xs hover:border-[#3b185f]/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-md bg-[#2a1b4e] text-white flex items-center justify-center mb-2">
                <Search className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">
                2. Application Tracking
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Monitoring timeline stages and municipal scrutinies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <ul className="list-disc pl-4 space-y-1">
                <li>Stage 1: Automated AI Screening (instant upon upload)</li>
                <li>Stage 2: Municipal Town Planner Verification (3-4 days)</li>
                <li>Stage 3: Joint Fire & Structural Review</li>
                <li>Stage 4: Digital Sanction Letter or Defect Intimation</li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/applications"
                  className="text-xs font-bold text-[#3b185f] hover:underline inline-flex items-center"
                >
                  Track an Application <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 3. Building QR & Public Record Guide */}
          <Card className="bg-white border-slate-200 shadow-2xs hover:border-[#3b185f]/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-md bg-blue-700 text-white flex items-center justify-center mb-2">
                <QrCode className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-900">
                3. Building QR & Public Record
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Accessing transparent public safety certifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-600">
              <ul className="list-disc pl-4 space-y-1">
                <li>Search by Building UID (e.g. BLD-NCR-2024-0012)</li>
                <li>View certified building height, occupancy, and fire rating</li>
                <li>Inspect dates and outcomes of mandatory 180-day audits</li>
                <li>Download publicly disclosed inspection certificates</li>
              </ul>
              <div className="pt-2">
                <Link
                  href="/buildings"
                  className="text-xs font-bold text-[#3b185f] hover:underline inline-flex items-center"
                >
                  Search Building Registry <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Frequently Asked Questions */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <HelpCircle className="w-5 h-5 text-[#2a1b4e]" />
            <h3 className="text-base font-bold text-slate-900">
              Frequently Asked Procedural Questions
            </h3>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            {faqs.map((faq, idx) => (
              <div key={idx} className={idx === 0 ? "space-y-1.5" : "pt-4 space-y-1.5"}>
                <h4 className="text-xs font-bold text-slate-900 flex items-start">
                  <span className="text-[#ea580c] mr-2">Q{idx + 1}.</span> {faq.question}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Official Civic Assistance Guidance (No fake personal contact info) */}
        <div className="bg-[#f8f9fa] border border-slate-200 rounded-lg p-5 text-xs space-y-2 text-slate-700">
          <span className="font-bold text-slate-900 flex items-center">
            <Shield className="w-4 h-4 mr-1.5 text-blue-900" />
            Official Assistance & In-Person Helpdesks
          </span>
          <p className="text-slate-600 leading-relaxed">
            Citizens requiring physical verification assistance or technical drawing reformatting may visit the dedicated Citizen Facilitation Counters (CFC) operating at the respective Municipal Corporation Zonal Headquarters across Delhi NCR on all working days between 10:00 AM and 4:00 PM.
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            NIRMAANTRA Statutory System • National Capital Territory of Delhi / National Capital Region
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
