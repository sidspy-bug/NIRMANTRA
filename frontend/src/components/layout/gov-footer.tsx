import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function GovFooter() {
  return (
    <footer className="w-full bg-[#1e293b] text-slate-300 border-t border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between text-xs gap-3">
        {/* Left: Portal Identity */}
        <div className="flex items-center space-x-2">
          <span className="font-bold tracking-wide text-white">NIRMAANTRA</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-medium">Building Safety & Compliance Portal</span>
        </div>

        {/* Center: Legal & Statutory Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-slate-400 text-[11px]">
          <Link href="#about" className="hover:text-white transition-colors">
            About
          </Link>
          <span>|</span>
          <Link href="#contact" className="hover:text-white transition-colors">
            Contact Us
          </Link>
          <span>|</span>
          <Link href="#accessibility" className="hover:text-white transition-colors">
            Accessibility
          </Link>
          <span>|</span>
          <Link href="#privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <span>|</span>
          <Link href="#terms" className="hover:text-white transition-colors">
            Terms of Use
          </Link>
          <span>|</span>
          <Link href="#help" className="hover:text-white transition-colors">
            Help
          </Link>
        </div>

        {/* Right: Copyright */}
        <div className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} NIRMAANTRA, All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
