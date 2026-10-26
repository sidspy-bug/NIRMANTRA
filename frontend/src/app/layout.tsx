import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { PortalShell } from "@/components/layout/portal-shell";

export const metadata: Metadata = {
  title: "NIRMAANTRA - Building Safety & Compliance Portal",
  description:
    "National Capital Region (Delhi NCR) single-window digital portal for automated building plan compliance verification, NBC safety regulations, inspection workflows, building UID tracking, and citizen public accountability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>
          <PortalShell>{children}</PortalShell>
        </AuthProvider>
      </body>
    </html>
  );
}
